import { useState } from "react";

import { Hexagon, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "123") {
      onLogin();
    } else {
      setError("Credenciais inválidas. Tente novamente.");
      setPassword("");
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
            <div className="bg-rose-50 text-rose-600 text-sm font-medium p-3 rounded-xl border border-rose-100 text-center animate-pulse">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Usuário
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-slate-50 font-medium text-slate-700"
                  placeholder="admin"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-slate-50 font-medium text-slate-700"
                  placeholder="123"
                  required
                />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
          >
            Entrar no Sistema
          </Button>
        </form>
      </Card>
    </div>
  );
};
