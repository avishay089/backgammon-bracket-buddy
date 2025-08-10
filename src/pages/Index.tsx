import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <SEO
        title="Backgammon Tournament Manager"
        description="Create divisions, schedule matches, record results, and run playoffs for your backgammon tournament."
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/15 to-transparent" />
      <section className="container py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Backgammon Tournament Manager</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Organize divisions, generate match schedules, track results including gammons, and advance smoothly to playoffs.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/tournament">
            <Button variant="default" size="lg">Start Tournament</Button>
          </Link>
          <a href="#learn-more">
            <Button variant="outline" size="lg">Learn More</Button>
          </a>
        </div>
      </section>
    </main>
  );
};

export default Index;
