"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboard } from "./hooks/useKeyboard";
import { useHudStore } from "./store";
import * as THREE from "three";
import { Html } from "@react-three/drei";

const BALL_RADIUS = 0.22;
const PLAYER_HEIGHT = 1.85;
const FIELD_HALF_WIDTH = 14;
const FIELD_LENGTH = 36;
const GOAL_WIDTH = 7.32;
const GOAL_HEIGHT = 2.44;
const GOAL_DEPTH = 2.4;
const GOAL_LINE_Z = -20;
const BALL_START = new THREE.Vector3(0, BALL_RADIUS, -2);

const tmpVec = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

const CLAMP = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function GameScene() {
  const keyboard = useKeyboard();
  const { camera, gl } = useThree();
  const setPower = useHudStore((state) => state.setPower);
  const setHeight = useHudStore((state) => state.setHeight);
  const setSpin = useHudStore((state) => state.setSpin);
  const setStage = useHudStore((state) => state.setStage);
  const resetHUD = useHudStore((state) => state.resetHUD);
  const registerGoal = useHudStore((state) => state.registerGoal);
  const registerMiss = useHudStore((state) => state.registerMiss);
  const announce = useHudStore((state) => state.announce);

  const playerRef = useRef<THREE.Group>(null);
  const ballRef = useRef<THREE.Mesh>(null);
  const keeperRef = useRef<THREE.Group>(null);

  const chargePower = useRef(0);
  const heightControl = useRef(0);
  const isCharging = useRef(false);
  const spinWindowActive = useRef(false);
  const spinWindowTime = useRef(0);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const spinAccumulator = useRef(0);
  const lastShotTime = useRef(0);
  const shotInFlight = useRef(false);
  const hasRegisteredResult = useRef(false);

  const ballPosition = useRef(BALL_START.clone());
  const ballVelocity = useRef(new THREE.Vector3());
  const ballSpin = useRef(new THREE.Vector3());

  const playerPosition = useRef(new THREE.Vector3(0, PLAYER_HEIGHT / 2, 4));
  const playerVelocity = useRef(new THREE.Vector3());

  const keeperPosition = useRef(new THREE.Vector3(0, 1.8, GOAL_LINE_Z - 0.25));
  const keeperTimer = useRef(0);

  const resetBall = useCallback(
    (hardReset = false) => {
      ballPosition.current.copy(BALL_START);
      ballVelocity.current.setScalar(0);
      ballSpin.current.setScalar(0);
      shotInFlight.current = false;
      hasRegisteredResult.current = false;
      chargePower.current = 0;
      heightControl.current = 0;
      spinAccumulator.current = 0;
      resetHUD();
      setStage("idle");
      setPower(0);
      setHeight(0);
      setSpin(0);
      if (hardReset) {
        playerPosition.current.set(0, PLAYER_HEIGHT / 2, 4);
      }
    },
    [resetHUD, setHeight, setPower, setSpin, setStage],
  );

  const beginCharge = useCallback(() => {
    if (shotInFlight.current) {
      return;
    }
    isCharging.current = true;
    chargePower.current = 0;
    setStage("charging");
    setPower(0);
    setHeight(heightControl.current);
    setSpin(0);
  }, [setHeight, setPower, setSpin, setStage]);

  const releaseShot = useCallback(() => {
    if (!isCharging.current || !ballRef.current || shotInFlight.current) {
      return;
    }

    isCharging.current = false;
    spinWindowActive.current = true;
    spinWindowTime.current = performance.now();
    spinAccumulator.current = 0;
    setStage("spinWindow");

    const shotPower = CLAMP(chargePower.current, 0, 1);
    const powerScalar = THREE.MathUtils.lerp(14, 32, Math.pow(shotPower, 1.1));

    const playerToBall = tmpVec
      .subVectors(ballPosition.current, playerPosition.current)
      .setY(0)
      .normalize();
    if (playerToBall.lengthSq() < 1e-5) {
      playerToBall.set(0, 0, -1);
    }

    const elevation = THREE.MathUtils.lerp(
      THREE.MathUtils.degToRad(3),
      THREE.MathUtils.degToRad(33),
      (heightControl.current + 1) / 2,
    );

    const horizontalSpeed = Math.cos(elevation) * powerScalar;
    const verticalSpeed = Math.sin(elevation) * powerScalar;

    const horizontalDir = playerToBall.clone().normalize();
    ballVelocity.current
      .copy(horizontalDir.multiplyScalar(horizontalSpeed))
      .setY(verticalSpeed);

    ballSpin.current.setScalar(0);
    shotInFlight.current = true;
    lastShotTime.current = performance.now();
    setPower(shotPower);
    setHeight(heightControl.current);
    setSpin(0);
  }, [setHeight, setPower, setSpin, setStage]);

  const applySpin = useCallback(() => {
    if (!spinWindowActive.current || !shotInFlight.current) {
      return;
    }

    spinWindowActive.current = false;
    const normalized = CLAMP(spinAccumulator.current / 240, -1.2, 1.2);
    ballSpin.current.set(0, normalized * 35, 0);
    setSpin(normalized);
    setStage("cooldown");
  }, [setSpin, setStage]);

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      lastPointer.current = { x: event.clientX, y: event.clientY };
      beginCharge();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      releaseShot();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!lastPointer.current) {
        lastPointer.current = { x: event.clientX, y: event.clientY };
      }

      const deltaX = event.movementX ?? event.clientX - lastPointer.current.x;
      const deltaY = event.movementY ?? event.clientY - lastPointer.current.y;

      if (isCharging.current) {
        heightControl.current = CLAMP(
          heightControl.current - deltaY * 0.0045,
          -1,
          1,
        );
        setHeight(heightControl.current);
        chargePower.current = CLAMP(
          chargePower.current + Math.abs(deltaX) * 0.0004,
          0,
          1.08,
        );
      }

      if (spinWindowActive.current) {
        spinAccumulator.current += deltaX;
      }

      lastPointer.current = { x: event.clientX, y: event.clientY };
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [beginCharge, gl.domElement, releaseShot, setHeight]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);

    const movement = tmpVec.set(0, 0, 0);
    if (keyboard.forward) movement.z -= 1;
    if (keyboard.backward) movement.z += 1;
    if (keyboard.left) movement.x -= 1;
    if (keyboard.right) movement.x += 1;

    if (movement.lengthSq() > 0) {
      movement.normalize();
    }

    const moveSpeed = keyboard.sprint ? 5.4 : 3.4;
    movement.multiplyScalar(moveSpeed * dt);
    playerVelocity.current.lerp(movement, 0.3);
    playerPosition.current.add(playerVelocity.current);

    const toBall = tmpVec
      .subVectors(playerPosition.current, ballPosition.current)
      .setY(0);
    if (toBall.length() > 2.8) {
      toBall.normalize();
      playerPosition.current.copy(
        tmpVec2.copy(ballPosition.current).add(toBall.multiplyScalar(2.8)),
      );
    }
    playerPosition.current.x = CLAMP(
      playerPosition.current.x,
      BALL_START.x - 4.4,
      BALL_START.x + 4.4,
    );
    playerPosition.current.z = CLAMP(
      playerPosition.current.z,
      BALL_START.z + 0.9,
      BALL_START.z + 6,
    );

    if (playerRef.current) {
      playerRef.current.position.copy(playerPosition.current);
      playerRef.current.lookAt(
        tmpVec
          .copy(ballPosition.current)
          .add(new THREE.Vector3(0, PLAYER_HEIGHT * 0.4, 0)),
      );
    }

    // Camera follows player
    const forward = tmpVec
      .subVectors(ballPosition.current, playerPosition.current)
      .setY(0)
      .normalize();
    if (forward.lengthSq() < 1e-5) {
      forward.set(0, 0, -1);
    }

    const cameraOffset = tmpVec2.copy(forward).multiplyScalar(-4.5);
    cameraOffset.y = 2.6;
    const desiredCamera = tmpVec
      .copy(playerPosition.current)
      .add(cameraOffset);

    camera.position.lerp(desiredCamera, 0.08);
    camera.lookAt(ballPosition.current.x, 1.1, ballPosition.current.z);

    // Power auto charge
    if (isCharging.current) {
      chargePower.current = CLAMP(chargePower.current + dt * 1.75, 0, 1.08);
      setPower(chargePower.current);
    }

    if (
      spinWindowActive.current &&
      performance.now() - spinWindowTime.current > 180
    ) {
      applySpin();
    }

    // Keeper idle animation
    keeperTimer.current += dt;
    keeperPosition.current.x = Math.sin(keeperTimer.current * 0.8) * 1.6;
    keeperPosition.current.y =
      1.85 + Math.sin(keeperTimer.current * 1.3) * 0.08;
    if (keeperRef.current) {
      keeperRef.current.position.set(
        keeperPosition.current.x,
        keeperPosition.current.y,
        keeperPosition.current.z,
      );
    }

    // Keeper reaction to shot
    if (shotInFlight.current && keeperRef.current) {
      const ballToKeeper = tmpVec
        .subVectors(ballPosition.current, keeperPosition.current)
        .setY(0);
      const distance = ballToKeeper.length();
      if (distance < 7) {
        const diveDirection = ballToKeeper.normalize().multiplyScalar(0.04);
        keeperRef.current.position.x += diveDirection.x;
        keeperRef.current.position.y += Math.abs(diveDirection.x) * 0.05;
      }
      keeperRef.current.lookAt(
        ballPosition.current.x,
        ballPosition.current.y,
        ballPosition.current.z,
      );
    }

    // Ball physics
    const gravity = -9.81;
    const airDrag = 0.18;
    const groundFriction = 5.5;
    const spinDrag = 1.6;
    const magnus = 0.025;

    if (shotInFlight.current || ballVelocity.current.lengthSq() > 0.0001) {
      ballVelocity.current.y += gravity * dt;
      ballVelocity.current.multiplyScalar(1 - airDrag * dt);

      const magnusLift = tmpVec
        .copy(ballSpin.current)
        .cross(ballVelocity.current)
        .multiplyScalar(magnus * dt);
      ballVelocity.current.add(magnusLift);

      ballSpin.current.multiplyScalar(1 - spinDrag * dt);

      ballPosition.current.addScaledVector(ballVelocity.current, dt);

      // Ground collision
      if (ballPosition.current.y < BALL_RADIUS) {
        ballPosition.current.y = BALL_RADIUS;
        if (ballVelocity.current.y < 0) {
          ballVelocity.current.y *= -0.32;
          ballVelocity.current.x *= 0.82;
          ballVelocity.current.z *= 0.82;
        }

        const horizontal = Math.hypot(
          ballVelocity.current.x,
          ballVelocity.current.z,
        );
        if (horizontal > 0) {
          const frictionForce = Math.min(horizontal, groundFriction * dt);
          const frictionScale = (horizontal - frictionForce) / horizontal;
          ballVelocity.current.x *= frictionScale;
          ballVelocity.current.z *= frictionScale;
        }
      }

      // Field boundaries
      if (Math.abs(ballPosition.current.x) > FIELD_HALF_WIDTH) {
        ballPosition.current.x = Math.sign(ballPosition.current.x) *
          FIELD_HALF_WIDTH;
        ballVelocity.current.x *= -0.4;
      }
      if (ballPosition.current.z > BALL_START.z + 10) {
        ballPosition.current.z = BALL_START.z + 10;
        ballVelocity.current.z *= -0.35;
      }
      if (ballPosition.current.z < -FIELD_LENGTH) {
        ballPosition.current.z = -FIELD_LENGTH;
        ballVelocity.current.z *= -0.35;
      }

      if (keeperRef.current) {
        const keeperPos = keeperRef.current.position;
        const toBall = tmpVec
          .subVectors(ballPosition.current, keeperPos)
          .setY(ballPosition.current.y - keeperPos.y);
        const distance = toBall.length();
        if (
          distance < 0.75 &&
          ballVelocity.current.lengthSq() > 0.02 &&
          !hasRegisteredResult.current &&
          toBall.z > -0.5
        ) {
          const normal = toBall.normalize();
          ballVelocity.current.reflect(normal).multiplyScalar(0.4);
          ballSpin.current.multiplyScalar(0.3);
          announce("saved");
          registerMiss();
          hasRegisteredResult.current = true;
        }
      }

      // Goal detection
      if (!hasRegisteredResult.current) {
        if (
          ballPosition.current.z < GOAL_LINE_Z &&
          Math.abs(ballPosition.current.x) < GOAL_WIDTH / 2 &&
          ballPosition.current.y > 0.4 &&
          ballPosition.current.y < GOAL_HEIGHT
        ) {
          registerGoal();
          hasRegisteredResult.current = true;
        } else if (
          ballPosition.current.z < GOAL_LINE_Z &&
          ballPosition.current.y >= GOAL_HEIGHT
        ) {
          announce("bar");
          registerMiss();
          hasRegisteredResult.current = true;
        } else if (
          ballPosition.current.z < GOAL_LINE_Z &&
          Math.abs(ballPosition.current.x) >= GOAL_WIDTH / 2
        ) {
          announce("wide");
          registerMiss();
          hasRegisteredResult.current = true;
        }
      }

      if (ballRef.current) {
        ballRef.current.position.copy(ballPosition.current);
        ballRef.current.rotation.x += ballVelocity.current.z * dt * 0.8;
        ballRef.current.rotation.z -= ballVelocity.current.x * dt * 0.8;
      }
    }

    // Auto reset if shot finished
    if (
      shotInFlight.current &&
      performance.now() - lastShotTime.current > 4800
    ) {
      resetBall();
    } else if (
      shotInFlight.current &&
      ballVelocity.current.length() < 0.2 &&
      ballPosition.current.y <= BALL_RADIUS + 0.01 &&
      performance.now() - lastShotTime.current > 1800
    ) {
      resetBall();
    }
  });

  return (
    <>
      <color args={["#06080f"]} attach="background" />
      <fog attach="fog" args={["#06080f", 12, 68]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        intensity={1.1}
        castShadow
        position={[4, 12, 6]}
        shadow-mapSize={[2048, 2048]}
      />
      <spotLight
        position={[-6, 16, 4]}
        intensity={0.5}
        angle={0.6}
        penumbra={0.4}
        color="#4a98ff"
      />
      <group position={[0, 0, 0]}>
        <Field />
        <Goal />
        <mesh
          ref={ballRef}
          position={[BALL_START.x, BALL_START.y, BALL_START.z]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
          <meshStandardMaterial
            color="#f5f5f5"
            roughness={0.38}
            metalness={0.12}
          />
        </mesh>
        <Player ref={playerRef} />
        <Keeper ref={keeperRef} />
      </group>
    </>
  );
}

const Field = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FIELD_HALF_WIDTH * 2, FIELD_LENGTH * 2]} />
        <meshStandardMaterial color="#0e5e2b" roughness={0.85} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, GOAL_LINE_Z + 9]}
      >
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#0c4d24" roughness={0.9} />
      </mesh>
      {/* Penalty arc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -11]}>
        <ringGeometry args={[8.8, 9, 64, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#d9fdd1" side={THREE.DoubleSide} />
      </mesh>
      {/* Penalty spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0025, -11]} castShadow>
        <circleGeometry args={[0.18, 24]} />
        <meshBasicMaterial color="#f8fff0" />
      </mesh>
      {/* Wall markers */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, BALL_START.z]}>
        <ringGeometry args={[0.4, 0.55, 32]} />
        <meshBasicMaterial color="#c7f7c1" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Goal = () => {
  return (
    <group position={[0, 0, GOAL_LINE_Z]}>
      <mesh position={[0, GOAL_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[GOAL_WIDTH + 1.2, GOAL_HEIGHT + 1.2, 0.2]} />
        <meshStandardMaterial color="#0c1020" metalness={0.4} roughness={0.8} />
      </mesh>
      <mesh
        position={[0, GOAL_HEIGHT / 2, -GOAL_DEPTH / 2]}
        rotation={[0, 0, 0]}
        castShadow
      >
        <boxGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, 0.15]} />
        <meshStandardMaterial color="#f0f6ff" roughness={0.25} />
      </mesh>
      <mesh
        position={[0, GOAL_HEIGHT / 2, -GOAL_DEPTH]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, 0.05]} />
        <meshStandardMaterial color="#dfe9ff" roughness={0.8} />
      </mesh>
      {/* Net */}
      <mesh position={[0, GOAL_HEIGHT / 2, -GOAL_DEPTH / 2]}>
        <planeGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, 16, 12]} />
        <meshStandardMaterial
          color="#d9e7ff"
          transparent
          opacity={0.18}
          wireframe
        />
      </mesh>
      <mesh position={[0, GOAL_HEIGHT / 2, -0.01]}>
        <planeGeometry args={[GOAL_WIDTH, GOAL_HEIGHT, 16, 12]} />
        <meshStandardMaterial
          color="#9db8ff"
          transparent
          opacity={0.08}
          wireframe
        />
      </mesh>
      {/* Posts */}
      <mesh position={[GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, GOAL_HEIGHT, 16]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.2} />
      </mesh>
      <mesh position={[-GOAL_WIDTH / 2, GOAL_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, GOAL_HEIGHT, 16]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.2} />
      </mesh>
      <mesh
        position={[0, GOAL_HEIGHT + 0.035, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.07, 0.07, GOAL_WIDTH, 16]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.2} />
      </mesh>
    </group>
  );
};

const Player = (
  props: JSX.IntrinsicElements["group"] & { children?: React.ReactNode },
) => {
  return (
    <group {...props}>
      <mesh position={[0, PLAYER_HEIGHT * 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.3, PLAYER_HEIGHT * 0.5, 12, 24]} />
        <meshStandardMaterial color="#3f82ff" roughness={0.45} />
      </mesh>
      <mesh position={[0, PLAYER_HEIGHT - 0.18, 0]} castShadow>
        <sphereGeometry args={[0.24, 24, 16]} />
        <meshStandardMaterial color="#e4c7a7" roughness={0.5} />
      </mesh>
      <mesh position={[0.28, 0.34, 0.12]} castShadow>
        <boxGeometry args={[0.16, 0.66, 0.16]} />
        <meshStandardMaterial color="#0f234d" />
      </mesh>
      <mesh position={[-0.28, 0.34, 0.12]} castShadow>
        <boxGeometry args={[0.16, 0.66, 0.16]} />
        <meshStandardMaterial color="#0f234d" />
      </mesh>
      <Html position={[0, PLAYER_HEIGHT + 0.3, 0]} center>
        <div className="rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] text-white/50 backdrop-blur">
          PSO Vuruşçu
        </div>
      </Html>
    </group>
  );
};

const Keeper = (
  props: JSX.IntrinsicElements["group"] & { children?: React.ReactNode },
) => (
  <group {...props}>
    <mesh position={[0, 0.95, 0]} castShadow>
      <capsuleGeometry args={[0.35, 1.2, 12, 24]} />
      <meshStandardMaterial color="#2dcf67" roughness={0.35} />
    </mesh>
    <mesh position={[0, 2.1, 0]} castShadow>
      <sphereGeometry args={[0.3, 24, 18]} />
      <meshStandardMaterial color="#e1bf90" roughness={0.5} />
    </mesh>
    <mesh position={[0.35, 0.6, 0]}>
      <boxGeometry args={[0.18, 1.2, 0.18]} />
      <meshStandardMaterial color="#0f331d" />
    </mesh>
    <mesh position={[-0.35, 0.6, 0]}>
      <boxGeometry args={[0.18, 1.2, 0.18]} />
      <meshStandardMaterial color="#0f331d" />
    </mesh>
    <Html position={[0, 2.6, 0]} center>
      <div className="rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.35em] text-white/50 backdrop-blur">
        Kaleci AI
      </div>
    </Html>
  </group>
);
