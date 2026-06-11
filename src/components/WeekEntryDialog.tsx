import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDM, addDays, toISODate } from "@/lib/week";
import { useAuth } from "@/hooks/use-auth";

export interface WeekEntry {
  id?: string;
  member_id: string;
  week_start: string;
  tasks: string[];
  meetings: string[];
  prospection: string;
  observations: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberName: string;
  weekStart: Date;
  entry: WeekEntry;
  onSaved: () => void;
}

export function WeekEntryDialog({ open, onOpenChange, memberName, weekStart, entry, onSaved }: Props) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<string[]>(entry.tasks.length ? entry.tasks : [""]);
  const [meetings, setMeetings] = useState<string[]>(entry.meetings.length ? entry.meetings : [""]);
  const [prospection, setProspection] = useState(entry.prospection || "");
  const [observations, setObservations] = useState(entry.observations || "");
  const [saving, setSaving] = useState(false);

  const weekEnd = addDays(weekStart, 6);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      member_id: entry.member_id,
      week_start: toISODate(weekStart),
      tasks: tasks.map((t) => t.trim()).filter(Boolean),
      meetings: meetings.map((m) => m.trim()).filter(Boolean),
      prospection: prospection.trim(),
      observations: observations.trim(),
      created_by: user?.id,
    };
    const { error } = await supabase
      .from("weekly_entries")
      .upsert(payload, { onConflict: "member_id,week_start" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registro salvo");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {memberName} — {formatDM(weekStart)} a {formatDM(weekEnd)}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-5">
          <ListField label="Tarefas" items={tasks} setItems={setTasks} placeholder="Descreva a tarefa realizada..." />
          <ListField label="Reuniões" items={meetings} setItems={setMeetings} placeholder="Descreva a reunião..." />
          <div className="space-y-2">
            <Label>Prospecção</Label>
            <Textarea
              value={prospection}
              onChange={(e) => setProspection(e.target.value)}
              placeholder="Ex: 5 leads contactados, 2 propostas enviadas..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observações adicionais..."
              rows={2}
            />
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

function ListField({
  label, items, setItems, placeholder,
}: { label: string; items: string[]; setItems: (s: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setItems([...items, ""])}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={it}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                setItems(next);
              }}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function _hideUnusedSwitchWarning() { return Switch; }
