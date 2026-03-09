import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <img src="/pwa-192x192.png" alt="ApexConsult" className="w-20 h-20 mx-auto rounded-2xl mb-4" />
          <CardTitle className="text-2xl">Instalar ApexConsult</CardTitle>
          <CardDescription>
            Acesse o ApexConsult direto da sua tela inicial, com acesso rápido e suporte offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="text-lg font-medium">App já instalado!</p>
              <p className="text-sm text-muted-foreground">
                Abra o ApexConsult pela sua tela inicial.
              </p>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} variant="gold" className="w-full" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Instalar agora
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">iPhone / iPad</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em <strong>Compartilhar</strong> (ícone ↑) → <strong>Adicionar à Tela de Início</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">Android</p>
                  <p className="text-sm text-muted-foreground">
                    Toque no menu do navegador (⋮) → <strong>Instalar app</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">Desktop (Chrome / Edge)</p>
                  <p className="text-sm text-muted-foreground">
                    Clique no ícone de instalação na barra de endereço
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
