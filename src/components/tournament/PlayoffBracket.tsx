import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTournament } from "@/store/useTournamentStore";

const PlayoffBracket = () => {
  const { state, dispatch } = useTournament();
  const [size, setSize] = useState<"4" | "8" | "16">("8");

  const seeded = Boolean(state.playoffs?.seeded);

  const canSeed = useMemo(() => state.players.length > 1, [state.players.length]);

  return (
    <div className="space-y-4">
      <Card className="bg-card/60 backdrop-blur border-border/60">
        <CardHeader>
          <CardTitle>Playoff Setup</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Select value={size} onValueChange={(v) => setSize(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Playoff size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">Top 4</SelectItem>
              <SelectItem value="8">Top 8</SelectItem>
              <SelectItem value="16">Top 16</SelectItem>
            </SelectContent>
          </Select>
          <Button disabled={!canSeed} onClick={() => dispatch({ type: "SEED_PLAYOFFS", size: Number(size) as any })}>
            Seed from Standings
          </Button>
        </CardContent>
      </Card>

      {state.playoffs && (
        <div className="overflow-x-auto">
          <div className="flex items-start gap-6 min-w-[720px]">
            {state.playoffs.rounds.map((round, rIdx) => (
              <div key={rIdx} className="min-w-[220px] space-y-3">
                <div className="text-sm font-medium">{roundLabel(rIdx, state.playoffs.size)}</div>
                {round.map((m, idx) => (
                  <Card key={m.id} className="bg-card/60 backdrop-blur border-border/60">
                    <CardContent className="py-3">
                      <div className="space-y-2">
                        <TeamButton
                          id={m.aId}
                          label={playerName(state, m.aId)}
                          active={m.winnerId === m.aId}
                          onClick={() => m.aId && dispatch({ type: "RECORD_PLAYOFF_RESULT", matchId: m.id, winnerId: m.aId })}
                        />
                        <TeamButton
                          id={m.bId}
                          label={playerName(state, m.bId)}
                          active={m.winnerId === m.bId}
                          onClick={() => m.bId && dispatch({ type: "RECORD_PLAYOFF_RESULT", matchId: m.id, winnerId: m.bId })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function playerName(state: ReturnType<typeof useTournament>["state"], id?: string) {
  if (!id) return "TBD";
  return state.players.find((p) => p.id === id)?.name || "TBD";
}

function TeamButton({ id, label, active, onClick }: { id?: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`w-full text-left px-3 py-2 rounded-md border transition ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
      } ${!id ? "opacity-60" : ""}`}
      onClick={onClick}
      disabled={!id}
    >
      {label}
    </button>
  );
}

function roundLabel(idx: number, size: number) {
  const labels: Record<number, string> = {
    0: size === 4 ? "Semifinals" : size === 8 ? "Quarterfinals" : "Round of 16",
    1: size === 4 ? "Final" : size === 8 ? "Semifinals" : "Quarterfinals",
    2: size === 4 ? "Champion" : size === 8 ? "Final" : "Semifinals",
    3: "Final",
  };
  return labels[idx] || `Round ${idx + 1}`;
}

export default PlayoffBracket;
