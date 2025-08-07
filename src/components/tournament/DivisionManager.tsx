import { useState } from "react";
import { useTournament } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";
import { nanoid } from "nanoid/non-secure";

const DivisionManager = () => {
  const { state, dispatch } = useTournament();
  const { toast } = useToast();
  const [divisionName, setDivisionName] = useState("");
  const [newPlayer, setNewPlayer] = useState<Record<string, string>>({});
  const [importedNames, setImportedNames] = useState<string[]>([]);
  const [divisionsCount, setDivisionsCount] = useState<number>(2);
  const [isParsing, setIsParsing] = useState(false);

  const parseFile = async (file: File) => {
    try {
      setIsParsing(true);
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const values = rows
        .flat()
        .map((v) => (typeof v === "string" ? v.trim() : v))
        .filter((v) => typeof v === "string" && v.length > 0) as string[];
      const names = values[0]?.toLowerCase?.() === "name" ? values.slice(1) : values;
      setImportedNames(names);
      toast({ title: "Imported", description: `Found ${names.length} players.` });
    } catch (e) {
      toast({ title: "Import failed", description: "Could not read the Excel file.", variant: "destructive" as any });
    } finally {
      setIsParsing(false);
    }
  };

  function secureShuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const buf = new Uint32Array(a.length);
      crypto.getRandomValues(buf);
      for (let i = a.length - 1; i > 0; i--) {
        const j = buf[i] % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
    } else {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
    }
    return a;
  }

  const handleImportDistribute = () => {
    const n = Math.max(1, Math.floor(divisionsCount || 1));
    if (importedNames.length === 0) {
      toast({ title: "No players", description: "Please import an Excel file with a Name column." });
      return;
    }
    const divIds: string[] = [];
    for (let i = 0; i < n; i++) {
      const id = nanoid();
      divIds.push(id);
      dispatch({ type: "ADD_DIVISION", name: `Division ${i + 1}`, id });
    }
    const shuffled = secureShuffle(importedNames);
    shuffled.forEach((name, idx) => {
      const divId = divIds[idx % n];
      dispatch({ type: "ADD_PLAYER", divisionId: divId, name });
    });
    setImportedNames([]);
    toast({ title: "Players added", description: `Created ${n} divisions and added ${shuffled.length} players.` });
  };

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

      <Card className="bg-card/60 backdrop-blur border-border/60">
        <CardHeader>
          <CardTitle>Import Players from Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files && parseFile(e.target.files[0])} disabled={isParsing} />
            <Input
              type="number"
              min={1}
              value={divisionsCount}
              onChange={(e) => setDivisionsCount(Number(e.target.value))}
              className="w-32"
            />
            <Button onClick={handleImportDistribute} disabled={isParsing || importedNames.length === 0}>
              Import & Distribute
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Upload .xlsx with a single Name column. Players will be distributed randomly into the selected number of divisions.
          </div>
          {importedNames.length > 0 && (
            <div className="text-xs text-muted-foreground">Imported {importedNames.length} names ready to assign.</div>
          )}
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
