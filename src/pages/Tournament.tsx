import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentProvider } from "@/store/useTournamentStore";
import DivisionManager from "@/components/tournament/DivisionManager";
import MatchList from "@/components/tournament/MatchList";
import StandingsTable from "@/components/tournament/StandingsTable";
import PlayoffBracket from "@/components/tournament/PlayoffBracket";
import SEO from "@/components/SEO";

const Tournament = () => {
  return (
    <TournamentProvider>
      <SEO
        title="Tournament Dashboard | Backgammon Manager"
        description="Create divisions, add players, schedule matches, record results, and run playoffs."
      />
      <main className="container py-8">
        <section className="mb-6">
          <Card className="bg-card/60 backdrop-blur border-border/60 shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Tournament Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Manage divisions and players, generate round-robin matches, update results (with gammon), and build your playoffs.
            </CardContent>
          </Card>
        </section>

        <Tabs defaultValue="divisions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="playoffs">Playoffs</TabsTrigger>
          </TabsList>

          <TabsContent value="divisions">
            <DivisionManager />
          </TabsContent>

          <TabsContent value="matches">
            <MatchList />
          </TabsContent>

          <TabsContent value="standings">
            <StandingsTable />
          </TabsContent>

          <TabsContent value="playoffs">
            <PlayoffBracket />
          </TabsContent>
        </Tabs>
      </main>
    </TournamentProvider>
  );
};

export default Tournament;
