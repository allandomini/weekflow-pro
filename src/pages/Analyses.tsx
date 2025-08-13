import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#06b6d4", "#a855f7", "#0ea5e9", "#e11d48"];

function groupByDay<T extends { date: Date }>(items: T[]) {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const key = format(new Date(i.date), "yyyy-MM-dd");
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }));
}

function secondsToMinutes(sec: number) {
  return Math.round(sec / 60);
}

export default function Analyses() {
  const {
    // produtividade
    tasks,
    pomodoroSessions,
    // finanças
    accounts,
    transactions,
    // network
    contacts,
    contactGroups,
  } = useApp();

  // PRODUTIVIDADE
  const tasksCompletedByDay = useMemo(() => {
    const completed = tasks.filter((t) => t.completed);
    return groupByDay(completed);
  }, [tasks]);

  const pomodoroMinutesByDay = useMemo(() => {
    const sessions = pomodoroSessions.map((s) => ({ date: s.startTime, minutes: secondsToMinutes(s.duration) }));
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const key = format(new Date(s.date), "yyyy-MM-dd");
      map.set(key, (map.get(key) || 0) + s.minutes);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, minutes]) => ({ date, minutes }));
  }, [pomodoroSessions]);

  // FINANÇAS
  const balancePerAccount = useMemo(() => {
    return accounts.map((a) => ({ name: a.name, balance: a.balance }));
  }, [accounts]);

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "withdrawal")
      .forEach((t) => {
        // categoria pode estar no sufixo da descrição após " • "
        const parts = (t.description || "").split(" • ");
        const category = (parts[1] || t.category || "geral").toLowerCase();
        map.set(category, (map.get(category) || 0) + t.amount);
      });
    const arr = Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
    arr.sort((a, b) => b.amount - a.amount);
    return arr;
  }, [transactions]);

  // NETWORK
  const contactsByGroup = useMemo(() => {
    const map = new Map<string, number>();
    contactGroups.forEach((g) => map.set(g.name, 0));
    contacts.forEach((c) => {
      if (c.groupIds?.length) {
        c.groupIds.forEach((gid) => {
          const group = contactGroups.find((g) => g.id === gid);
          if (group) map.set(group.name, (map.get(group.name) || 0) + 1);
        });
      } else {
        map.set("Sem grupo", (map.get("Sem grupo") || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [contacts, contactGroups]);

  const contactsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    contacts.forEach((c) => {
      const key = format(new Date(c.createdAt), "yyyy-MM");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, count]) => ({ month, count }));
  }, [contacts]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Analyses</h2>
        <p className="text-muted-foreground">Visão analítica de produtividade, finanças e network.</p>
      </div>

      <Tabs defaultValue="productivity">
        <TabsList>
          <TabsTrigger value="productivity">Produtividade</TabsTrigger>
          <TabsTrigger value="finances">Finanças</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="productivity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas concluídas por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  count: { label: "Concluídas", color: "hsl(var(--primary))" },
                }}
                className="h-64"
              >
                <LineChart data={tasksCompletedByDay} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "d MMM", { locale: ptBR })} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minutos de Pomodoro por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ minutes: { label: "Minutos", color: "hsl(var(--chart-2, 200, 100%, 50%))" } }}
                className="h-64"
              >
                <BarChart data={pomodoroMinutesByDay} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "d MMM", { locale: ptBR })} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saldo por conta</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ balance: { label: "Saldo", color: "hsl(var(--primary))" } }}
                className="h-64"
              >
                <BarChart data={balancePerAccount} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="balance" fill="var(--color-balance)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Despesas por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {expensesByCategory.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contatos por grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ count: { label: "Contatos", color: "hsl(var(--primary))" } }}
                className="h-64"
              >
                <BarChart data={contactsByGroup} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Novos contatos por mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ count: { label: "Novos", color: "hsl(var(--chart-4, 260, 100%, 60%))" } }}
                className="h-64"
              >
                <LineChart data={contactsByMonth} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
