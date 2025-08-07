import { useTournament } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const StandingsTable = () => {
  const { state, standingsByDivision } = useTournament();

  if (state.divisions.length === 0) {
    return <div className="text-muted-foreground">Add divisions and players to see standings.</div>;
  }

  return (
    <div className="space-y-6">
      {state.divisions.map((d) => {
        const rows = standingsByDivision[d.id] || [];
        return (
          <Card key={d.id} className="bg-card/60 backdrop-blur border-border/60">
            <CardHeader>
              <CardTitle>{d.name} Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>W</TableHead>
                    <TableHead>L</TableHead>
                    <TableHead>Gammons</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.player.id}>
                      <TableCell>{r.player.name}</TableCell>
                      <TableCell>{r.wins}</TableCell>
                      <TableCell>{r.losses}</TableCell>
                      <TableCell>{r.gammonWins}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StandingsTable;
