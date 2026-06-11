import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { initialsFromName } from "@/lib/week";
import { MemberFormDialog, type Member } from "@/components/MemberFormDialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/equipe")({ component: Equipe });

function Equipe() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<(Member & { id: string })[]>([]);
  const [editing, setEditing] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<(Member & { id: string }) | null>(null);

  async function load() {
    const { data } = await supabase.from("members").select("*").order("name");
    setMembers((data as any) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function confirmDelete() {
    if (!deleting?.id) return;
    const { error } = await supabase.from("members").delete().eq("id", deleting.id);
    if (error) toast.error(error.message);
    else { toast.success("Membro removido"); load(); }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground text-sm">Gerencie os membros da equipe</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Novo Membro
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="text-xs rounded-lg bg-muted px-3 py-2 text-muted-foreground">
          Apenas administradores podem adicionar, editar ou remover membros.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <Card key={m.id} className="p-4 shadow-card hover:shadow-elegant transition group">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center font-bold">
                {initialsFromName(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.role_title}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.area && <Badge variant="secondary" className="text-[10px]">{m.area}</Badge>}
                  <Badge className={m.active ? "" : "bg-muted text-muted-foreground"}>
                    {m.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              {isAdmin && (
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button className="p-1 hover:text-primary" onClick={() => { setEditing(m); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:text-destructive" onClick={() => setDeleting(m)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
        {members.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-xl">
            Nenhum membro cadastrado ainda.
          </div>
        )}
      </div>

      <MemberFormDialog open={open} onOpenChange={setOpen} member={editing} onSaved={load} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os registros semanais deste membro também serão apagados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
