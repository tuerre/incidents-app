"use client";

import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Completa todos los campos.");
      return;
    }

    setLoading(true);

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setLoading(false);
      setError(authError?.message || "Credenciales inválidas.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Acceso solo para administradores.");
      return;
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-white">

      {/* TOP NAV */}
      <div className="absolute top-0 right-0 p-4">
        <button
          type="button"
          className="flex items-center gap-1.5 border border-[#333] rounded-md px-3 py-1.5 text-sm text-gray-300 hover:border-[#555] hover:text-white transition"
        >
          {/* Book icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Documentation
        </button>
      </div>

      {/* MAIN SPLIT */}
      <div className="flex flex-1">

        {/* ── LEFT PANEL ── */}
        <div className="w-full lg:w-[40%] bg-[#171717] border-r border-[#333] flex flex-col justify-between px-10 py-16 min-h-screen">

          {/* Logo */}
          <div className="flex items-center gap-2">
            {/* Supabase lightning bolt logo */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M12.5 2L3 13.5h8L9.5 20 19 8.5h-8L12.5 2z"
                fill="#3ECF8E"
              />
            </svg>
            <span className="text-[15px] font-medium tracking-wide">Amanera </span>
          </div>

          {/* Form area */}
          <div className="w-full max-w-[360px] mx-auto">

            <h1 className="text-[26px] font-semibold mb-1">Bienvenido de vuelta</h1>
            <p className="text-[14px] text-[#8c8c8c] mb-6">Inicia sesión para continuar</p>

            {/* GitHub button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 border border-[#2e2e2e] bg-[#1a1a1a] hover:bg-[#222] rounded-md py-2 px-4 text-sm text-gray-200 transition mb-2.5"
            >
              {/* GitHub icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Disponible para Administradores
            </button>

            {/* SSO button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 border border-[#2e2e2e] bg-[#1a1a1a] hover:bg-[#222] rounded-md py-2 px-4 text-sm text-gray-200 transition mb-5"
            >
              {/* Lock icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Bloqueado para Empleados
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#222]" />
              <span className="text-[13px] text-[#555]">o</span>
              <div className="flex-1 h-px bg-[#222]" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email */}
              <div>
                <label className="block text-[13px] text-[#a0a0a0] mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2e2e2e] rounded-md px-3 py-2 text-sm text-gray-100 placeholder-[#454545] focus:outline-none focus:border-[#555] transition"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[13px] text-[#a0a0a0]">Contraseña</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#141414] border border-[#2e2e2e] rounded-md px-3 py-2 pr-10 text-sm text-gray-100 placeholder-[#454545] focus:outline-none focus:border-[#555] transition"
                  />
                  {/* Eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition"
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-[13px]">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3ECF8E] hover:bg-[#2dbf7e] text-black font-medium rounded-md py-2 text-sm transition disabled:opacity-50"
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>

            </form>

            {/* Sign up */}
            <p className="text-[13px] text-center text-[#555] mt-5">
              ¿Eres un empleado?{" "}
              <span className="text-white/40 underline cursor-pointer">Descarga la app</span>
            </p>

          </div>

          {/* Footer terms */}
          <p className="text-[11px] text-center text-[#444] leading-relaxed max-w-[300px] mx-auto">
            Al continuar, aceptas los{" "}
            <span className="underline cursor-pointer">Términos de Servicio</span>{" "}
            y{" "}
            <span className="underline cursor-pointer">Política de Privacidad</span>
            , y aceptas recibir correos electrónicos periódicos con actualizaciones.
          </p>

        </div>

        {/* ── DIVIDER ── */}
        <div className="hidden lg:block w-px bg-[#1a1a1a] my-8" />

        {/* ── RIGHT PANEL ── */}
        <div className="hidden lg:flex flex-1 bg-[#0f0f0f] items-center justify-center px-16">
          <div className="max-w-[520px]">

            {/* Big quote mark */}
            <p className="text-[200px] leading-none text-[#303030] select-none absolute top-54 left-217 font-serif mb-2">&ldquo;</p>

            {/* Quote text */}
            <p className="text-white text-[22px] font-medium leading-snug mb-8">
              Desde que implementamos Amanera, la gestión de incidencias en nuestro hotel cambió por completo. Lo que antes era desorden y retrasos, ahora es organización, rapidez y control total. Es un sistema confiable, seguro y hecho exactamente para lo que necesitamos.
            </p>

            {/* Attribution */}
            <div className="flex items-center gap-3">
              {/* Avatar - circular image via next/image or img */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://futureoflife.org/wp-content/uploads/2020/08/elon_musk_royal_society.jpg"
                width={40}
                height={40}
                className="rounded-full object-cover border select-none border-[#333]"
              />
              <span className="text-[14px] text-[#a0a0a0]">@RickyEcheverria</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
