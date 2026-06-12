import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Printer, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addDays, formatDM, MONTHS_PT, startOfWeek, toISODate, weeksOfMonth, initialsFromName } from "@/lib/week";
import lignumLogo from "@/assets/lignum.png.asset.json";
import iffLogo from "@/assets/iff.png.asset.json";

export const Route = createFileRoute("/_authenticated/relatorios")({ component: Relatorios });

interface Member { id: string; name: string; role_title: string; }
interface Entry {
  member_id: string; week_start: string;
  tasks: string[]; meetings: string[]; prospection: string; observations: string;
}

function Relatorios() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const weeks = useMemo(() => weeksOfMonth(year, month), [year, month]);
  const currentISO = toISODate(startOfWeek(today));
  const defaultIdx = Math.max(0, weeks.findIndex((w) => toISODate(w) === currentISO));
  const [weekIdx, setWeekIdx] = useState(defaultIdx);
  const [members, setMembers] = useState<Member[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => { setWeekIdx(Math.max(0, weeks.findIndex((w) => toISODate(w) === currentISO))); /* eslint-disable-next-line */ }, [year, month]);

  useEffect(() => {
    (async () => {
      const week = weeks[weekIdx] ?? weeks[0];
      const iso = toISODate(week);
      const [m, e] = await Promise.all([
        supabase.from("members").select("id,name,role_title").eq("active", true).order("name"),
        supabase.from("weekly_entries").select("*").eq("week_start", iso),
      ]);
      setMembers((m.data as Member[]) ?? []);
      setEntries(((e.data as unknown) as Entry[]) ?? []);
    })();
  }, [year, month, weekIdx, weeks]);

  function changeMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear()); setMonth(d.getMonth()); setWeekIdx(0);
  }

  const weekStart = weeks[weekIdx] ?? weeks[0];
  const weekEnd = addDays(weekStart, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Relatório Semanal</h1>
          <p className="text-muted-foreground text-sm">Gere e exporte o relatório central da equipe</p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <Card className="p-4 no-print flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="px-3 py-2 rounded-md bg-muted text-sm font-medium min-w-32 text-center">
            {MONTHS_PT[month]} {year}
          </div>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {weeks.map((w, i) => (
            <button
              key={toISODate(w)}
              onClick={() => setWeekIdx(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${
                i === weekIdx ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"
              }`}
            >
              {formatDM(w)} – {formatDM(addDays(w, 6))}
            </button>
          ))}
        </div>
      </Card>

      <div className="print-area">
        <div className="mx-auto max-w-[820px] bg-white rounded-xl border-4 border-primary overflow-hidden shadow-card">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between gap-4">
            <div className="h-14 w-14 rounded-full bg-white/15 grid place-items-center">
              <img src={lignumLogo.url} alt="Lignum" className="h-10 w-10 object-contain invert" />
            </div>
            <div className="text-center flex-1">
              <div className="text-xl font-extrabold tracking-wide">LIGNUM AMBIENTAL JR.</div>
              <div className="text-xs opacity-90">Empresa Júnior de Engenharia Ambiental</div>
            </div>
            <div className="h-14 w-14 rounded bg-white grid place-items-center">
              <img src={iffLogo.url} alt="IFF" className="h-12 w-12 object-contain" />
            </div>
          </div>
          <div className="text-center py-3 text-foreground font-semibold border-b-4 border-primary">
            RELATÓRIO SEMANAL: {formatDM(weekStart)} – {formatDM(weekEnd)}
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 bg-white text-black">
            {members.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Sem membros ativos.</p>
            )}
            {members.map((m) => {
              const e = entries.find((x) => x.member_id === m.id);
              return (
                <div key={m.id} className="border-t-2 border-primary/60 pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-[10px] font-bold">
                      {initialsFromName(m.name)}
                    </div>
                    <div className="font-bold text-sm">{m.name} <span className="font-normal text-muted-foreground">— {m.role_title}</span></div>
                  </div>
                  <ReportSection title="Tarefas" items={e?.tasks ?? []} />
                  <ReportSection title="Reuniões" items={e?.meetings ?? []} />
                  <ReportLine title="Prospecção" text={e?.prospection} />
                  {e?.observations && <ReportLine title="Observações" text={e.observations} />}
                </div>
              );
            })}
          </div>

          <div className="border-t-4 border-primary px-6 py-4 text-center italic text-sm bg-primary/5">
            "Ninguém constrói uma obra relevante com o tempo que sobra, constrói com o tempo que dedica."
            <div className="not-italic text-xs text-muted-foreground mt-1">— Mário Sérgio Cortella </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="text-sm mt-1">
      <div className="font-semibold">{title}:</div>
      {items.length === 0 ? (
        <div className="text-muted-foreground text-xs pl-4">—</div>
      ) : (
        <ul className="list-disc pl-6 text-xs space-y-0.5">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  );
}

function ReportLine({ title, text }: { title: string; text?: string }) {
  return (
    <div className="text-sm mt-1">
      <span className="font-semibold">{title}: </span>
      <span className="text-xs">{text?.trim() ? text : "—"}</span>
    </div>
  );
}

// keep tree-shake from removing icon import
export const _u = FileDown;
