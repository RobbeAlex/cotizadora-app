import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ShoppingCart, Plus, Check, MapPin, Phone, Package, Store, X, Globe, Wifi, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ResultItem = {
  material: string;
  marca: string;
  presentacion: string;
  precio: number;
  vendedor: string;
  direccion?: string;
  telefono?: string;
  fuente?: string;
  url?: string;
};

type SearchResponse = {
  resultados: ResultItem[];
  total: number;
  query: string;
  fuente?: string;
  advertencia?: string;
};

type CartItem = ResultItem & { cantidad: number };

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [showCart, setShowCart] = useState(false);
  const [cotizNombre, setCotizNombre] = useState("");
  const [savingCotiz, setSavingCotiz] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: materiales } = useQuery<string[]>({
    queryKey: ["/api/materiales"],
  });

  const {
    data: results,
    isFetching,
    isError,
  } = useQuery<SearchResponse>({
    queryKey: ["/api/buscar", searched],
    enabled: searched.length >= 2,
    queryFn: () => apiRequest("GET", `/api/buscar?q=${encodeURIComponent(searched)}`).then(r => r.json()),
    staleTime: 1000 * 60 * 5, // 5 min cache
    retry: 1,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/cotizaciones", data).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cotizaciones"] });
      toast({ title: "Cotización guardada", description: `"${cotizNombre}" guardada exitosamente.` });
      setCart([]);
      setAdded(new Set());
      setCotizNombre("");
      setSavingCotiz(false);
      setShowCart(false);
    },
    onError: () => toast({ title: "Error", description: "No se pudo guardar la cotización.", variant: "destructive" }),
  });

  const handleSearch = () => {
    if (query.trim().length >= 2) setSearched(query.trim());
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const addToCart = (item: ResultItem) => {
    const key = `${item.material}-${item.marca}-${item.presentacion}`;
    setCart(prev => {
      const exists = prev.find(c => `${c.material}-${c.marca}-${c.presentacion}` === key);
      if (exists) {
        return prev.map(c => `${c.material}-${c.marca}-${c.presentacion}` === key ? { ...c, cantidad: c.cantidad + 1 } : c);
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
    setAdded(prev => new Set([...prev, key]));
    toast({ title: "Agregado a cotización", description: `${item.marca} — ${item.presentacion}` });
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(c => `${c.material}-${c.marca}-${c.presentacion}` !== key));
    setAdded(prev => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
  };

  const updateQty = (key: string, delta: number) => {
    setCart(prev => prev.map(c => {
      const k = `${c.material}-${c.marca}-${c.presentacion}`;
      if (k === key) {
        const newQty = Math.max(1, c.cantidad + delta);
        return { ...c, cantidad: newQty };
      }
      return c;
    }));
  };

  const total = cart.reduce((s, c) => s + c.precio * c.cantidad, 0);

  const saveCotizacion = () => {
    if (!cotizNombre.trim()) {
      toast({ title: "Nombre requerido", description: "Escribe un nombre para esta cotización.", variant: "destructive" });
      return;
    }
    const items = cart.map(c => ({
      material: c.material,
      marca: c.marca,
      presentacion: c.presentacion,
      precio: c.precio,
      vendedor: c.vendedor,
      cantidad: c.cantidad,
      subtotal: c.precio * c.cantidad,
    }));
    saveMutation.mutate({
      nombre: cotizNombre,
      createdAt: new Date().toISOString(),
      items: JSON.stringify(items),
      total,
    });
  };

  const suggestions = materiales?.filter(m => 
    m.toLowerCase().includes(query.toLowerCase()) && query.length > 0
  ).slice(0, 6) ?? [];

  return (
    <div className="relative">
      {/* Hero de búsqueda */}
      <div className="mb-8">
        <div className="mb-1">
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs font-medium">
            Zona Metro Guadalajara
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>
          Cotizador de Materiales
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          Búsqueda en tiempo real · Cualquier material · Zona Metropolitana de Guadalajara
        </p>

        {/* Buscador */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Busca cualquier material: cemento, cable 10AWG, tinaco, pintura vinílica..."
                className="pl-9 h-11 text-sm"
                data-testid="input-buscar"
              />
              {/* Sugerencias */}
              {suggestions.length > 0 && query.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); setSearched(s); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={query.trim().length < 2}
              className="h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              data-testid="button-buscar"
            >
              Buscar
            </Button>
          </div>
        </div>

        {/* Categorías con chips */}
        {!searched && (
          <div className="mt-4 space-y-3">
            {[
              {
                label: "Obra gruesa",
                items: ["Cemento", "Varilla", "Block", "Concreto", "Grava", "Arena", "Tabique rojo", "Malla"]
              },
              {
                label: "Acabados",
                items: ["Estuco", "Cal", "Yeso", "Mortero", "Pintura", "Impermeabilizante", "Sellador", "Azulejo", "Loseta", "Mosaico"]
              },
              {
                label: "Eléctrico",
                items: ["Cable eléctrico", "Conduit", "Interruptor", "Contacto", "Tablero", "Breaker", "Luminaria", "Cinta eléctrica"]
              },
              {
                label: "Plomería",
                items: ["Tubo PVC", "Tubo de cobre", "Llave de paso", "Lavabo", "Inodoro", "Cisterna", "Bomba de agua"]
              },
              {
                label: "Herrería y estructura",
                items: ["Ángulo de acero", "Solera", "Tubo cuadrado", "Tubo redondo", "Viga de acero", "Lámina galvanizada"]
              },
              {
                label: "Particiones y aislamiento",
                items: ["Tablaroca", "Perfil de acero", "Madera", "Poliestireno", "Lana mineral", "Teja"]
              },
            ].map(({ label, items }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(m => (
                    <button
                      key={m}
                      onClick={() => { setQuery(m); setSearched(m); }}
                      className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-colors text-muted-foreground hover:text-primary"
                      data-testid={`chip-${m.toLowerCase().replace(/ /g, '-')}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resultados */}
      {isFetching && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-muted/50 border border-border">
            <Globe className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
            <span>Buscando precios en ferreterías y tiendas de la ZMG en tiempo real...</span>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No se pudieron obtener resultados. Intenta de nuevo.</p>
        </div>
      )}

      {results && !isFetching && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-foreground">
                  {results.total} opciones para <span className="text-primary">"{results.query}"</span>
                </p>
                <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary bg-primary/5 py-0">
                  <Wifi className="w-2.5 h-2.5" /> En vivo
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Precios verificados en tiendas reales · ZMG Junio 2026</p>
            </div>
            {cart.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCart(true)}
                className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                data-testid="button-ver-cotizacion"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Cotización ({cart.length})
              </Button>
            )}
          </div>

          {/* Advertencia si hay menos resultados de lo esperado */}
          {results.advertencia && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">{results.advertencia}</p>
            </div>
          )}

          {results.resultados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Sin resultados en tiendas verificadas</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">No encontramos precios reales para este término. Intenta con un nombre más específico o en español.</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="list-resultados">
              {results.resultados.map((item, idx) => {
                const key = `${item.material}-${item.marca}-${item.presentacion}`;
                const isAdded = added.has(key);
                return (
                  <Card
                    key={idx}
                    className="border border-border hover:border-primary/30 transition-colors"
                    data-testid={`card-resultado-${idx}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Rank badge */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {idx + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground text-sm" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}} data-testid={`text-material-${idx}`}>
                              {item.material}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {item.marca}
                            </Badge>
                            {idx === 0 && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                Mejor precio
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Package className="w-3 h-3 flex-shrink-0" />
                              <span data-testid={`text-presentacion-${idx}`}>{item.presentacion}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Store className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate" data-testid={`text-vendedor-${idx}`}>{item.vendedor}</span>
                            </div>
                            {item.direccion && (
                              <div className="flex items-start gap-1.5 text-xs text-muted-foreground sm:col-span-2">
                                <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                <span>{item.direccion}</span>
                              </div>
                            )}
                            {item.telefono && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span>{item.telefono}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Precio + Acción */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}} data-testid={`text-precio-${idx}`}>
                              ${item.precio.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-muted-foreground">MXN</div>
                          </div>
                          <div className="flex flex-col gap-1.5 items-end">
                            <Button
                              size="sm"
                              variant={isAdded ? "secondary" : "default"}
                              onClick={() => addToCart(item)}
                              className={isAdded ? "gap-1 text-xs" : "gap-1 text-xs bg-primary hover:bg-primary/90"}
                              data-testid={`button-agregar-${idx}`}
                            >
                              {isAdded ? (
                                <><Check className="w-3 h-3" /> Agregado</>
                              ) : (
                                <><Plus className="w-3 h-3" /> Agregar</>
                              )}
                            </Button>
                            {item.fuente && item.fuente.startsWith("http") && (
                              <a
                                href={item.fuente}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                data-testid={`link-fuente-${idx}`}
                              >
                                <ExternalLink className="w-2.5 h-2.5" /> Ver en tienda
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panel cotización flotante */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-card border-l border-border flex flex-col h-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>
                Mi Cotización
              </h2>
              <button onClick={() => setShowCart(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => {
                const key = `${item.material}-${item.marca}-${item.presentacion}`;
                return (
                  <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border" data-testid={`cart-item-${key}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.marca}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.material} — {item.presentacion}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.vendedor}</p>
                      <p className="text-sm font-bold text-primary mt-1">
                        ${(item.precio * item.cantidad).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => removeFromCart(key)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(key, -1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-xs hover:bg-muted">−</button>
                        <span className="text-sm font-medium w-5 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQty(key, 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-xs hover:bg-muted">+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total estimado</span>
                <span className="text-xl font-bold text-foreground" style={{fontFamily: 'Cabinet Grotesk, sans-serif'}}>
                  ${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {savingCotiz ? (
                <div className="space-y-2">
                  <Input
                    value={cotizNombre}
                    onChange={e => setCotizNombre(e.target.value)}
                    placeholder="Nombre de la cotización (ej: Casa Lomas)"
                    className="text-sm h-9"
                    data-testid="input-nombre-cotizacion"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSavingCotiz(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveCotizacion}
                      disabled={saveMutation.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      data-testid="button-guardar-cotizacion"
                    >
                      {saveMutation.isPending ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setSavingCotiz(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  data-testid="button-iniciar-guardar"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Guardar cotización
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
