import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    navigate({ to: session ? "/painel" : "/auth", replace: true });
  }, [session, loading, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
