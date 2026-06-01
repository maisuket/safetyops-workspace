import { useState } from "react";
import { Hexagon, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const LoginScreen = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError("Credenciais inválidas. Tente novamente.");
        setPassword("");
        return;
      }

      const { access_token } = await response.json();
      onLogin(access_token);
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique a sua ligação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="rounded-3xl w-full max-w-sm shadow-2xl border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 transform -rotate-6">
            <Hexagon size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            ITAM <span className="text-emerald-400">HUB</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Acesso Restrito</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm font-medium p-3 rounded-xl border border-rose-100 text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Usuário
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-slate-50 font-medium text-slate-700"
                  placeholder="Usuário"
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-slate-50 font-medium text-slate-700"
                  placeholder="Senha"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar no Sistema"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};
