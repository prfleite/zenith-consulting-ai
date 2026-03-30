import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Eye, EyeOff, ArrowRight, Shield, Zap, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const features = [
  { icon: Zap, label: "IA Integrada", desc: "Insights automáticos com GPT-4" },
  { icon: Users, label: "CRM Completo", desc: "Clientes, projetos e pipeline" },
  { icon: Shield, label: "Seguro", desc: "Dados protegidos com Supabase" },
];

const Login = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-info/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/3 blur-[100px] pointer-events-none" />

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(hsl(43 74% 55%) 1px, transparent 1px), linear-gradient(90deg, hsl(43 74% 55%) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
      />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left: branding */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex flex-col gap-8"
        >
          {/* Logo large */}
          <div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold"
            >
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-5xl font-heading font-bold leading-tight">
              <span className="text-gradient-gold">Apex</span>
              <span className="text-foreground">Consult</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
              A plataforma premium para consultorias que querem crescer com inteligência artificial.
            </p>
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card/40 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-gold-subtle border border-[var(--border-gold)] flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-heading font-bold">
              <span className="text-gradient-gold">Apex</span>Consult
            </h1>
          </div>

          <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-glass">
            <div className="mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSignUp ? "signup" : "login"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isSignUp ? "Comece sua jornada no ApexConsult" : "Acesse sua plataforma de consultoria"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <label className="text-sm text-muted-foreground mb-1.5 block">Nome completo</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      required={isSignUp}
                      className="bg-secondary/50 border-border focus:border-gold/50 transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-secondary/50 border-border focus:border-gold/50 transition-colors"
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
                    className="bg-secondary/50 border-border focus:border-gold/50 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  variant="gold"
                  className="w-full group gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Aguarde...
                    </span>
                  ) : (
                    <>
                      {isSignUp ? "Criar conta" : "Entrar"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
