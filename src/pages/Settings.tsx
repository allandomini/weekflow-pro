import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { useAnimations } from "@/contexts/AnimationContext";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

export default function Settings() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");
  const [notifications, setNotifications] = useState<boolean>(() => localStorage.getItem("notifications") !== "false");
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const { aiSettings, updateAISettings, actorName, updateActorName, deleteUserAccount } = useAppContext();
  const { animationsEnabled, toggleAnimations } = useAnimations();
  const { t } = useTranslation();
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
      alert(t('settings.import_error'));
    }
  };

  const resetData = () => {
    if (!confirm(t('settings.confirm_reset_data'))) return;
    const preserve = ['theme'];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !preserve.includes(key)) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    location.reload();
  };

  const handleDeleteAccount = async () => {
    await deleteUserAccount();
    setDeleteConfirmText("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LanguageSelector />
        
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{t('settings.appearance')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('settings.theme')}</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('settings.light_mode')}</SelectItem>
                  <SelectItem value="domini-dark">{t('settings.dark_mode')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.animations')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.enable_animations')}</p>
              </div>
              <Switch checked={animationsEnabled} onCheckedChange={toggleAnimations} />
            </div>
            <div>
              <Label>{t('settings.account')}</Label>
              <Input className="mt-1" value={actorName} onChange={(e) => updateActorName(e.target.value)} placeholder={t('settings.account')} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{t('settings.notifications')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.notifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.settings_alerts.notifications_description')}</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{t('settings.backup_data')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={exportData}>{t('settings.export_backup')}</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>{t('settings.import_backup')}</Button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
              }} />
            </div>
            <div>
              <Button variant="destructive" onClick={resetData}>{t('settings.reset_data')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{t('ai.title')} (Gemini)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.settings_alerts.ai_assistant_enabled')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.settings_alerts.ai_assistant_description')}</p>
              </div>
              <Switch
                checked={aiSettings.enabled}
                onCheckedChange={(v) => updateAISettings({ enabled: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>{t('settings.deep_analysis')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.deep_analysis_description')}</p>
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

      {/* Account Management */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>{t('settings.account_management')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold">{t('settings.delete_account')}</Label>
            <p className="text-sm text-muted-foreground mt-1">{t('settings.delete_account_description')}</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full border-muted-foreground/20 hover:bg-muted">
                {t('settings.delete_account')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('settings.confirm_delete_account')}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium">{t('settings.delete_account_warning')}</div>
                      <div className="mt-2 text-sm whitespace-pre-line">
                        {t('settings.delete_account_items')}
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md border">
                      <div className="font-medium text-sm">
                        {t('settings.delete_account_final_warning')}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">
                        {t('settings.type_delete_to_confirm')}
                      </Label>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="EXCLUIR"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'EXCLUIR'}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {t('settings.delete_account')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

