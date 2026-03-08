import { Settings, User, Bell, Shield, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-5 h-5 text-gold" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Perfil</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Nome</label>
            <Input defaultValue="João Consultor" className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
            <Input defaultValue="joao@apexconsult.com" className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Cargo</label>
            <Input defaultValue="Sócio Diretor" className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Telefone</label>
            <Input defaultValue="+55 11 99999-0000" className="bg-secondary border-border" />
          </div>
        </div>
        <Button variant="gold" size="sm">Salvar Alterações</Button>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-5 h-5 text-gold" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Notificações</h3>
        </div>
        {["Novos projetos", "Alertas de risco de churn", "Relatórios prontos", "Insights da IA"].map((item) => (
          <div key={item} className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">{item}</span>
            <div className="w-10 h-5 rounded-full bg-gold/30 relative cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-gold absolute top-0.5 right-0.5 shadow-gold" />
            </div>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-gold" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Segurança</h3>
        </div>
        <Button variant="outline" size="sm">Alterar Senha</Button>
        <Button variant="outline" size="sm" className="ml-2">Ativar 2FA</Button>
      </div>
    </div>
  );
}
