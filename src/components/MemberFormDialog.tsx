import { useState, type FormEvent, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Member {
  id?: string;
  name: string;
  role_title: string;
  area: string | null;
  active: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member?: Member | null;
  onSaved: () => void;
}

const EMPTY: Member = { name: "", role_title: "", area: "", active: true };

export function MemberFormDialog({ open, onOpenChange, member, onSaved }: Props) {
  const [data, setData] = useState<Member>(member ?? EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setData(member ?? EMPTY); }, [member, open]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...data, area: data.area || null };
    const { error } = member?.id
      ? await supabase.from("members").update(payload).eq("id", member.id)
      : await supabase.from("members").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(member?.id ? "Membro atualizado" : "Membro adicionado");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member?.id ? "Editar membro" : "Novo membro"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-name">Nome</Label>
            <Input id="m-name" required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-role">Cargo</Label>
            <Input id="m-role" required placeholder="Ex: Assessor de Projetos"
              value={data.role_title} onChange={(e) => setData({ ...data, role_title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-area">Área</Label>
            <Input id="m-area" placeholder="Ex: Projetos, Gestão, Comunicação..."
              value={data.area ?? ""} onChange={(e) => setData({ ...data, area: e.target.value })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Membro ativo</Label>
              <p className="text-xs text-muted-foreground">Inativos não aparecem no painel semanal.</p>
            </div>
            <Switch checked={data.active} onCheckedChange={(v) => setData({ ...data, active: v })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
