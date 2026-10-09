import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Search, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { HistorialBusqueda } from "@shared/schema";
import { useLocation } from "wouter";

export default function HistorialPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: historial, isLoading } = useQuery<HistorialBusqueda[]>({
    queryKey: ["/api/historial"],
  });

  const clearMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/historial"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/historial"] });
      toast({ title: "Historial limpiado" });
    },
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} hr${diffHrs !== 1 ? "s" : ""}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? "s" : ""}`;
    return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
  };

  const handleRepeat = (query: string) => {
    navigate(`/?q=${encodeURIComponent(query)}`);
    // Trigger search on home page via URL (simplificado: redirigir con query)
    navigate("/");
    // Store query for auto-search
    sessionStorage.setItem("repeat_query", query);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>Historial de búsquedas</h1>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}><CardContent className="p-3"><Skeleton className="h-10 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>Historial de búsquedas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {historial?.length ?? 0} búsqueda{historial?.length !== 1 ? "s" : ""} recientes
          </p>
        </div>
        {historial && historial.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
            data-testid="button-limpiar-historial"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar todo
          </Button>
        )}
      </div>

      {!historial || historial.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground text-sm">Sin historial aún</p>
          <p className="text-xs mt-1">Tus búsquedas aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {historial.map((h, idx) => (
            <Card
              key={h.id}
              className="border border-border hover:border-primary/20 transition-colors"
              data-testid={`card-historial-${idx}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground capitalize truncate" data-testid={`text-query-${idx}`}>
                      {h.query}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{h.resultCount} resultado{h.resultCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate("/")}
                    className="text-primary hover:bg-primary/5 gap-1 text-xs flex-shrink-0"
                    data-testid={`button-repetir-${idx}`}
                  >
                    Buscar
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
