import { useState } from "react";
import { useTournament } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

const DivisionManager = () => {
  const { state, dispatch } = useTournament();
  const [divisionName, setDivisionName] = useState("");
  const [newPlayer, setNewPlayer] = useState<Record<string, string>>({});

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-card/60 backdrop-blur border-border/60">
        <CardHeader>
          <CardTitle>Add Divisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Division name"
              value={divisionName}
              onChange={(e) => setDivisionName(e.target.value)}
            />
            <Button
              variant="default"
              onClick={() => {
                dispatch({ type: "ADD_DIVISION", name: divisionName });
                setDivisionName("");
              }}
            >
              Add
            </Button>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            Tip: Create one or more divisions/conferences (e.g., East, West).
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {state.divisions.map((d) => (
          <Card key={d.id} className="bg-card/60 backdrop-blur border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{d.name}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: "REMOVE_DIVISION", id: d.id })}
              >
                <Trash2 className="mr-2" /> Remove
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Player name"
                  value={newPlayer[d.id] || ""}
                  onChange={(e) => setNewPlayer((p) => ({ ...p, [d.id]: e.target.value }))}
                />
                <Button
                  onClick={() => {
                    const name = (newPlayer[d.id] || "").trim();
                    if (!name) return;
                    dispatch({ type: "ADD_PLAYER", divisionId: d.id, name });
                    setNewPlayer((p) => ({ ...p, [d.id]: "" }));
                  }}
                >
                  Add Player
                </Button>
              </div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {state.players
                  .filter((p) => p.divisionId === d.id)
                  .map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-md border p-2">
                      <span>{p.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: "REMOVE_PLAYER", id: p.id })}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        {state.divisions.length > 0 && (
          <Card className="bg-card/60 backdrop-blur border-border/60">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                When ready, generate the round-robin schedule for all divisions.
              </div>
              <Button onClick={() => dispatch({ type: "GENERATE_MATCHES" })}>
                Generate Matches
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DivisionManager;
