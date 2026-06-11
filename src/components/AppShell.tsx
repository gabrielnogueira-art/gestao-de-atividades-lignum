import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, BarChart3, LogOut, PieChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import lignumLogo from "@/assets/lignum.png.asset.json";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: PieChart },
  { to: "/painel", label: "Painel", Icon: LayoutDashboard },
  { to: "/equipe", label: "Equipe", Icon: Users },
  { to: "/relatorios", label: "Relatórios", Icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { signOut, user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b no-print">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/painel" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-elegant">
              <img src={lignumLogo.url} alt="" className="h-6 w-6 object-contain invert" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-sm">TaskTracker</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Lignum Ambiental Jr.</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, Icon }) => {
              const active = loc.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-elegant"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-xs font-medium">{user?.email}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {isAdmin ? "Administrador" : "Membro"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
