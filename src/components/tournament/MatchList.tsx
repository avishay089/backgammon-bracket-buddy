import { useMemo, useState } from "react";
import { useTournament } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const MatchList = () => {
  const { state, dispatch } = useTournament();
  const [divisionFilter, setDivisionFilter] = useState<string>("all");

  const matches = useMemo(() => {
    if (divisionFilter === "all") return state.matches;
    return state.matches.filter((m) => m.divisionId === divisionFilter);
  }, [state.matches, divisionFilter]);

  const playerName = (id: string) => state.players.find((p) => p.id === id)?.name || "?";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={divisionFilter} onValueChange={setDivisionFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by division" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All divisions</SelectItem>
            {state.divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">Total matches: {matches.length}</div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((m) => {
          const result = m.result;
          const [winner, setWinner] = useState<string | undefined>(result?.winnerId);
          const [gammon, setGammon] = useState<boolean>(result?.gammon ?? false);
          // Local component per item – acceptable for list since items remain light
          return (
            <Card key={m.id} className="bg-card/60 backdrop-blur border-border/60">
              <CardHeader>
                <CardTitle className="text-base">{playerName(m.playerAId)} vs {playerName(m.playerBId)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant={winner === m.playerAId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWinner(m.playerAId)}
                  >
                    {playerName(m.playerAId)}
                  </Button>
                  <Button
                    variant={winner === m.playerBId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWinner(m.playerBId)}
                  >
                    {playerName(m.playerBId)}
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={gammon} onCheckedChange={(v) => setGammon(Boolean(v))} />
                  Gammon (double win)
                </label>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!winner) return;
                      dispatch({ type: "RECORD_RESULT", matchId: m.id, winnerId: winner, gammon });
                    }}
                  >
                    Save Result
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MatchList;
