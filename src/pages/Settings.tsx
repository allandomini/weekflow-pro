import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/contexts/AppContext";

export default function Settings() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState<boolean>(() => localStorage.getItem("notifications") !== "false");
  const { aiSettings, updateAISettings, actorName, updateActorName } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = document.documentElement;
    const enableDark = theme === "domini-dark";
    root.classList.toggle("domini-dark", enableDark);
    root.classList.toggle("dark", enableDark);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("notifications", String(notifications));
  }, [notifications]);

  const exportData = () => {
    const keys = [
      'projects','tasks','notes','todoLists','accounts','transactions','debts','goals','receivables',
      'contacts','contactGroups','projectImages','projectWalletEntries','clockifyTimeEntries','plakyBoards','plakyItems',
      'pomodoroSessions','pomodoroSettings','aiSettings','activities','actorName','theme','notifications'
    ];
    const dump: Record<string, any> = {};
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v !== null) {
        try {
          dump[k] = JSON.parse(v);
        } catch {
          // Not JSON, keep as plain string (e.g., actorName, theme, notifications)
          dump[k] = v;
        }
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekflow-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== 'object' || data === null) throw new Error('Arquivo inválido');
      Object.entries(data).forEach(([k, v]) => {
        localStorage.setItem(String(k), JSON.stringify(v));
      });
      location.reload();
    } catch (e) {
      console.error(e);
      alert('Falha ao importar backup. Verifique o arquivo.');
    }
  };

  const resetData = () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados? Esta ação é irreversível.')) return;
    const preserve = ['theme'];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !preserve.includes(key)) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    location.reload();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Configurações</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tema</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="domini-dark">Escuro (Domini)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome do Ator (Histórico)</Label>
              <Input className="mt-1" value={actorName} onChange={(e) => updateActorName(e.target.value)} placeholder="Seu nome" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Exibir notificações (toasts)</Label>
                <p className="text-sm text-muted-foreground">Habilita/Desabilita mensagens de alerta rápidas.</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Backup & Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={exportData}>Exportar Backup</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Importar Backup</Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
              }} />
            </div>
            <div>
              <Button variant="destructive" onClick={resetData}>Resetar Dados</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Assistente (Gemini)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Habilitar assistente</Label>
                <p className="text-sm text-muted-foreground">Mostra o botão do assistente e permite enviar mensagens.</p>
              </div>
              <Switch
                checked={aiSettings.enabled}
                onCheckedChange={(v) => updateAISettings({ enabled: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Análise profunda</Label>
                <p className="text-sm text-muted-foreground">Amplia o contexto analisado (tarefas, projetos, finanças e contatos).</p>
              </div>
              <Switch
                checked={aiSettings.deepAnalysis}
                onCheckedChange={(v) => updateAISettings({ deepAnalysis: v })}
                disabled={!aiSettings.enabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

