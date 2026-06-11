import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, ClipboardList, Calendar, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { MONTHS_PT } from "@/lib/week";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

interface Member { id: string; name: string; role_title: string; area: string | null; active: boolean; }
interface Entry {
  id: string; member_id: string; week_start: string;
  tasks: any[]; meetings: any[]; prospection: string; observations: string;
}

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ef4444"];

function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [m, e] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("weekly_entries").select("*"),
      ]);
      setMembers((m.data as Member[]) ?? []);
      setEntries(((e.data as unknown) as Entry[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const totals = useMemo(() => {
    let tasks = 0, meetings = 0, prosp = 0;
    for (const e of entries) {
      tasks += (e.tasks ?? []).length;
      meetings += (e.meetings ?? []).length;
      if (e.prospection?.trim()) prosp++;
    }
    return { tasks, meetings, prosp, members: members.filter((m) => m.active).length };
  }, [entries, members]);

  const perMember = useMemo(() => {
    return members.map((m) => {
      const es = entries.filter((e) => e.member_id === m.id);
      return {
        name: m.name.split(" ")[0],
        Tarefas: es.reduce((s, e) => s + (e.tasks?.length ?? 0), 0),
        Reuniões: es.reduce((s, e) => s + (e.meetings?.length ?? 0), 0),
      };
    });
  }, [members, entries]);

  const perMonth = useMemo(() => {
    const map = new Map<string, { mes: string; Tarefas: number; Reuniões: number; Prospecções: number }>();
    for (const e of entries) {
      const d = new Date(e.week_start);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = `${MONTHS_PT[d.getMonth()].slice(0, 3)}/${String(d.getFullYear()).slice(2)}`;
      const cur = map.get(key) ?? { mes: label, Tarefas: 0, Reuniões: 0, Prospecções: 0 };
      cur.Tarefas += e.tasks?.length ?? 0;
      cur.Reuniões += e.meetings?.length ?? 0;
      if (e.prospection?.trim()) cur.Prospecções += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [entries]);

  const perArea = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of members.filter((y) => y.active)) {
      const k = x.area || "Sem área";
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [members]);

  if (loading) {
    return <div className="py-16 grid place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral consolidada das atividades da Lignum Ambiental Jr.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={Users} label="Membros ativos" value={totals.members} color="text-primary" />
        <Stat icon={ClipboardList} label="Tarefas totais" value={totals.tasks} color="text-emerald-600" />
        <Stat icon={Calendar} label="Reuniões totais" value={totals.meetings} color="text-amber-600" />
        <Stat icon={TrendingUp} label="Semanas c/ prospecção" value={totals.prosp} color="text-sky-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-3">Atividades por membro</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perMember}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tarefas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reuniões" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Evolução mensal</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perMonth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mes" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Tarefas" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="Reuniões" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Prospecções" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="font-semibold mb-3">Membros por área</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={perArea} dataKey="value" nameKey="name" outerRadius={100} label>
                  {perArea.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-muted grid place-items-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </div>
    </Card>
  );
}
