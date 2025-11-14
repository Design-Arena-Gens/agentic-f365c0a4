import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/game/Game"), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <Game />
    </main>
  );
}
