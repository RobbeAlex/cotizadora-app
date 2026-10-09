import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Trash2, Download, Plus, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Cotizacion, CotizacionItem } from "@shared/schema";
import { Link } from "wouter";

export default function CotizacionesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: cotizaciones, isLoading } = useQuery<Cotizacion[]>({
    queryKey: ["/api/cotizaciones"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cotizaciones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cotizaciones"] });
      toast({ title: "Cotización eliminada" });
    },
  });

  const exportPDF = async (cotiz: Cotizacion) => {
    const items: CotizacionItem[] = JSON.parse(cotiz.items);
    const fecha = new Date(cotiz.createdAt).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric"
    });

    // Generar PDF usando la API de impresión del navegador como alternativa robusta
    const win = window.open("", "_blank");
    if (!win) return;

    const rows = items.map(item => `
      <tr>
        <td>${item.material}</td>
        <td>${item.marca}</td>
        <td>${item.presentacion}</td>
        <td style="text-align:right">$${item.precio.toLocaleString("es-MX", {minimumFractionDigits: 2})}</td>
        <td style="text-align:center">${item.cantidad}</td>
        <td>${item.vendedor}</td>
        <td style="text-align:right; font-weight:600">$${item.subtotal.toLocaleString("es-MX", {minimumFractionDigits: 2})}</td>
      </tr>
    `).join("");

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Cotización — ${cotiz.nombre}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; font-size: 12px; color: #1a1a1a; background: white; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #C44E1F; }
    .logo { font-size: 20px; font-weight: 800; color: #C44E1F; }
    .logo span { display: block; font-size: 10px; font-weight: 400; color: #888; margin-top: 2px; }
    .meta h2 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .meta p { color: #666; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #C44E1F; color: white; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr:nth-child(even) td { background: #fafafa; }
    .total-row { border-top: 2px solid #C44E1F; background: #fff8f6 !important; }
    .total-row td { font-weight: 700; font-size: 13px; padding: 12px 10px; }
    .footer { text-align: center; color: #aaa; font-size: 10px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">CotizaObra <span>Zona Metro Guadalajara</span></div>
    <div class="meta" style="text-align:right">
      <h2>${cotiz.nombre}</h2>
      <p>Fecha: ${fecha}</p>
      <p>Materiales: ${items.length} item${items.length !== 1 ? "s" : ""}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Material</th><th>Marca</th><th>Presentación</th><th style="text-align:right">P. Unitario</th><th style="text-align:center">Cant.</th><th>Vendedor</th><th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="6" style="text-align:right">TOTAL ESTIMADO</td>
        <td style="text-align:right; color:#C44E1F">$${cotiz.total.toLocaleString("es-MX", {minimumFractionDigits: 2})} MXN</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">
    Precios de referencia del mercado ZMG · CotizaObra 2025 · Sujeto a variación sin previo aviso
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    win.document.close();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>Cotizaciones guardadas</h1>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>Cotizaciones guardadas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {cotizaciones?.length ?? 0} cotización{cotizaciones?.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Link href="/">
          <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1.5" data-testid="button-nueva-busqueda">
            <Plus className="w-3.5 h-3.5" />
            Nueva búsqueda
          </Button>
        </Link>
      </div>

      {!cotizaciones || cotizaciones.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-foreground text-sm">Aún no tienes cotizaciones guardadas</p>
          <p className="text-xs mt-1 mb-4">Busca materiales y agrégalos a tu cotización</p>
          <Link href="/">
            <Button size="sm" variant="outline">Empezar a cotizar</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cotizaciones.map(c => {
            const items: CotizacionItem[] = JSON.parse(c.items);
            return (
              <Card key={c.id} className="border border-border hover:border-primary/20 transition-colors" data-testid={`card-cotizacion-${c.id}`}>
                <CardHeader className="pb-3 pt-4 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>
                        {c.nombre}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(c.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          {items.length} item{items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>
                        ${c.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">MXN</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {/* Items summary */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {items.slice(0, 4).map((item, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {item.material} — {item.marca}
                      </Badge>
                    ))}
                    {items.length > 4 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        +{items.length - 4} más
                      </Badge>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportPDF(c)}
                      className="gap-1.5 text-xs"
                      data-testid={`button-exportar-pdf-${c.id}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(c.id)}
                      disabled={deleteMutation.isPending}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                      data-testid={`button-eliminar-${c.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
