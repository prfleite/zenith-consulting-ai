import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, name);
      if (error) {
        toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Você pode fazer login agora." });
        setIsSignUp(false);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro no login", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Apex<span className="text-gradient-gold">Consult</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isSignUp ? "Crie sua conta" : "Acesse sua plataforma de consultoria"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-2xl p-8 border border-border shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Nome completo</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required={isSignUp}
                  className="bg-secondary border-border"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
              {isLoading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Credenciais demo:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Admin", email: "admin@zenith.demo" },
                { label: "Manager", email: "manager@zenith.demo" },
              ].map((cred) => (
                <button
                  key={cred.email}
                  onClick={() => { setEmail(cred.email); setPassword("demo123"); setIsSignUp(false); }}
                  className="text-xs px-3 py-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {cred.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
