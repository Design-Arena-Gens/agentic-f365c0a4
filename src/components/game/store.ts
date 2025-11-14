import { create } from "zustand";

export type ShotStage = "idle" | "charging" | "spinWindow" | "cooldown";
export type ShotResult = "goal" | "saved" | "wide" | "bar" | null;

interface ScoreboardState {
  attempts: number;
  goals: number;
  streak: number;
}

interface HudState {
  power: number;
  height: number;
  spin: number;
  stage: ShotStage;
  result: ShotResult;
  scoreboard: ScoreboardState;
  setPower: (power: number) => void;
  setHeight: (height: number) => void;
  setSpin: (spin: number) => void;
  setStage: (stage: ShotStage) => void;
  announce: (result: ShotResult) => void;
  registerGoal: () => void;
  registerMiss: () => void;
  resetHUD: () => void;
}

export const useHudStore = create<HudState>((set) => ({
  power: 0,
  height: 0,
  spin: 0,
  stage: "idle",
  result: null,
  scoreboard: {
    attempts: 0,
    goals: 0,
    streak: 0,
  },
  setPower: (power) => set({ power }),
  setHeight: (height) => set({ height }),
  setSpin: (spin) => set({ spin }),
  setStage: (stage) => set({ stage }),
  announce: (result) => set({ result }),
  registerGoal: () =>
    set((state) => ({
      scoreboard: {
        attempts: state.scoreboard.attempts + 1,
        goals: state.scoreboard.goals + 1,
        streak: state.scoreboard.streak + 1,
      },
      result: "goal",
    })),
  registerMiss: () =>
    set((state) => ({
      scoreboard: {
        attempts: state.scoreboard.attempts + 1,
        goals: state.scoreboard.goals,
        streak: 0,
      },
      result: state.result === "goal" ? null : state.result,
    })),
  resetHUD: () =>
    set({
      power: 0,
      height: 0,
      spin: 0,
      stage: "idle",
      result: null,
    }),
}));
