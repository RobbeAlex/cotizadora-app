import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, FileText, Clock, Sun, Moon, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const navItems = [
    { href: "/", label: "Buscar", icon: Search },
    { href: "/cotizaciones", label: "Cotizaciones", icon: FileText },
    { href: "/historial", label: "Historial", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer" data-testid="link-logo">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" aria-label="CotizaObra logo">
                  <path d="M6 24L11 12l5 9 5-7 5 10H6z" fill="white" opacity="0.95"/>
                  <circle cx="25" cy="10" r="3" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <div>
                <span className="font-display font-800 text-lg text-foreground leading-none block" style={{fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 800}}>CotizaObra</span>
                <span className="text-xs text-muted-foreground leading-none">Zona Metro Guadalajara</span>
              </div>
            </div>
          </Link>

          {/* Nav — desktop */}
          <nav className="hidden sm:flex items-center gap-1" aria-label="Navegación principal">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-${label.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    location === href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            ))}
          </nav>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            data-testid="button-theme-toggle"
            aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav — mobile */}
        <div className="sm:hidden border-t border-border">
          <nav className="flex" aria-label="Navegación móvil">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex-1">
                <div
                  data-testid={`mobile-nav-${label.toLowerCase()}`}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors cursor-pointer",
                    location === href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        <p>CotizaObra — Precios de referencia del mercado ZMG · Junio 2026</p>
      </footer>
    </div>
  );
}
