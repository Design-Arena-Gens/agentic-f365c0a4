import { useCallback, useEffect, useState } from "react";

export interface KeyboardState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
}

const keyMap: Record<string, keyof KeyboardState> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
};

export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const action = keyMap[event.code];
    if (!action) {
      return;
    }
    event.preventDefault();
    setState((prev) => {
      if (prev[action]) {
        return prev;
      }
      return { ...prev, [action]: true };
    });
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const action = keyMap[event.code];
    if (!action) {
      return;
    }
    event.preventDefault();
    setState((prev) => {
      if (!prev[action]) {
        return prev;
      }
      return { ...prev, [action]: false };
    });
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return state;
}
