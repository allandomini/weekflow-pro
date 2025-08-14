import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAppContext } from "@/contexts/SupabaseAppContext";

export default function Settings() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState<boolean>(() => localStorage.getItem("notifications") !== "false");
  const { aiSettings, updateAISettings } = useAppContext();

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

