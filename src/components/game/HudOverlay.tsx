"use client";

import { useMemo } from "react";
import { useHudStore } from "./store";

const stageLabels: Record<string, string> = {
  idle: "Hazır",
  charging: "Güç Ayarı",
  spinWindow: "Falso Seç",
  cooldown: "Top Bekleniyor",
};

const stageAccent: Record<string, string> = {
  idle: "border-zinc-600",
  charging: "border-emerald-400",
  spinWindow: "border-sky-400",
  cooldown: "border-zinc-700",
};

export function HudOverlay() {
  const { power, height, spin, stage, result, scoreboard } = useHudStore(
    (state) => ({
      power: state.power,
      height: state.height,
      spin: state.spin,
      stage: state.stage,
      result: state.result,
      scoreboard: state.scoreboard,
    }),
  );

  const powerPercent = Math.round(power * 100);
  const heightPercent = Math.round(((height + 1) / 2) * 100);
  const spinPercent = Math.round((Math.abs(spin) / 1.2) * 100);
  const spinDirection = spin > 0 ? "Sağ Falso" : spin < 0 ? "Sol Falso" : "Düz";

  const resultBadge = useMemo(() => {
    if (!result) {
      return null;
    }
    const configs: Record<string, { text: string; classes: string }> = {
      goal: {
        text: "GOL!",
        classes:
          "bg-emerald-500/40 text-emerald-100 border-emerald-400/40 uppercase tracking-[0.5em]",
      },
      saved: {
        text: "Kaleci Çeldi",
        classes: "bg-yellow-500/40 text-yellow-200 border-yellow-400/40",
      },
      wide: {
        text: "Aut",
        classes: "bg-rose-500/40 text-rose-100 border-rose-400/40",
      },
      bar: {
        text: "Direkten Döndü",
        classes: "bg-orange-500/40 text-orange-100 border-orange-400/40",
      },
    };
    const config =
      configs[result] ?? {
        text: result.toUpperCase(),
        classes: "bg-white/10 text-white border-white/20",
      };
    return (
      <div
        className={`rounded-full border px-3 py-1 text-xs backdrop-blur-sm ${config.classes}`}
      >
        {config.text}
      </div>
    );
  }, [result]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-lg">
          <h2 className="text-xs font-medium uppercase tracking-[0.35em] text-white/60">
            Serbest Vuruş
          </h2>
          <div className="mt-2 flex items-end gap-6">
            <div>
              <p className="text-3xl font-semibold text-white">
                {scoreboard.goals}
              </p>
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                Goller
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">
                {scoreboard.attempts}
              </p>
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                Deneme
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold text-emerald-300">
                {scoreboard.streak}
              </p>
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">
                Seri
              </p>
            </div>
          </div>
          {resultBadge && <div className="mt-3">{resultBadge}</div>}
        </div>
        <div
          className={`rounded-xl border bg-black/50 px-5 py-3 backdrop-blur-lg ${stageAccent[stage] ?? "border-zinc-600"}`}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Aşama
          </p>
          <p className="text-lg font-semibold text-white">{stageLabels[stage]}</p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-5 pb-6">
        <div className="flex w-[60%] min-w-[320px] flex-col gap-3 rounded-2xl border border-white/10 bg-black/60 p-5 backdrop-blur-lg">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">
              Güç
            </p>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-blue-500 transition-all duration-75"
                style={{ width: `${powerPercent}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs font-semibold text-emerald-200">
              {powerPercent}%
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                Yükseklik
              </p>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 transition-all duration-75"
                  style={{ width: `${heightPercent}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs font-semibold text-amber-200">
                {heightPercent}%
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                Falso
              </p>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full ${spin >= 0 ? "bg-gradient-to-r from-blue-400 to-sky-500" : "bg-gradient-to-r from-rose-400 via-pink-400 to-purple-500"}`}
                  style={{ width: `${Math.min(spinPercent, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs font-semibold text-sky-200">
                {spinDirection}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/70 px-5 py-3 text-center text-xs uppercase tracking-[0.35em] text-white/60 backdrop-blur">
          WASD: Pozisyon · Shift: Sprint · LMB Basılı: Güç · LMB Bırak +
          Fareyi Çek: Falso
        </div>
      </div>
    </div>
  );
}
