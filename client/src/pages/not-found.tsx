import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-4xl font-bold text-muted-foreground mb-2" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>404</h1>
      <p className="text-muted-foreground text-sm mb-4">Página no encontrada</p>
      <Link href="/">
        <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
          <Home className="w-3.5 h-3.5" />
          Ir al inicio
        </Button>
      </Link>
    </div>
  );
}
