import { useState } from "react";

import { Hexagon, Lock, User } from "lucide-react";

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
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
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
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700"
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
                  className="absolute left-3 top-3.5 text-slate-400"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-700"
                  placeholder="123"
                  required
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex justify-center items-center gap-2"
          >
            Entrar no Sistema
          </button>
        </form>
      </div>
    </div>
  );
};
