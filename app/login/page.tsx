"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { LuLoader, LuMail, LuLock, LuUser } from "react-icons/lu";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/Rituals";
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If already logged in, redirect away
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace(redirectTo);
      }
    });
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } else {
      router.push(redirectTo);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // Since email confirmation is OFF, user is logged in immediately
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirectTo);
      }
    } else {
      router.push(redirectTo);
    }
  };

  const switchTab = (newTab: "login" | "register") => {
    setTab(newTab);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex flex-col items-center mb-12">
        <span className="text-[#C5A059] font-serif text-lg font-bold tracking-[0.3em] leading-tight">
          HERITAGE
        </span>
        <span className="text-[#C5A059] font-serif text-lg font-bold tracking-[0.3em] leading-tight">
          ATELIER
        </span>
        <div className="w-12 h-[1px] bg-[#C5A059]/40 mt-4" />
      </div>

      {/* Card */}
      <div className="bg-[#141414]/80 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800/50">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
              tab === "login"
                ? "text-[#C5A059] border-b-2 border-[#C5A059] bg-[#C5A059]/5"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            LOG IN
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`flex-1 py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 ${
              tab === "register"
                ? "text-[#C5A059] border-b-2 border-[#C5A059] bg-[#C5A059]/5"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            REGISTER
          </button>
        </div>

        {/* Form */}
        <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="p-6 space-y-5">
          {/* Name field — Register only */}
          {tab === "register" && (
            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">
                NAMA LENGKAP
              </label>
              <div className="relative">
                <LuUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                  className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-lg pl-11 pr-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 focus:ring-1 focus:ring-[#C5A059]/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">
              EMAIL
            </label>
            <div className="relative">
              <LuMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-lg pl-11 pr-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 focus:ring-1 focus:ring-[#C5A059]/20 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">
              PASSWORD
            </label>
            <div className="relative">
              <LuLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-[#1A1A1A] border border-zinc-800 rounded-lg pl-11 pr-4 py-3.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 focus:ring-1 focus:ring-[#C5A059]/20 transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-xs text-center">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E5C158] text-black py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-all duration-300 shadow-lg shadow-[#E5C158]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <LuLoader className="w-4 h-4 animate-spin" />
            ) : tab === "login" ? (
              "MASUK"
            ) : (
              "DAFTAR"
            )}
          </button>
        </form>

        {/* Bottom helper text */}
        <div className="px-6 pb-6 text-center">
          <p className="text-zinc-600 text-xs">
            {tab === "login" ? (
              <>
                Belum punya akun?{" "}
                <button
                  onClick={() => switchTab("register")}
                  className="text-[#C5A059] hover:underline font-medium"
                >
                  Daftar sekarang
                </button>
              </>
            ) : (
              <>
                Sudah punya akun?{" "}
                <button
                  onClick={() => switchTab("login")}
                  className="text-[#C5A059] hover:underline font-medium"
                >
                  Masuk di sini
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Back Link */}
      <div className="text-center mt-8">
        <Link
          href="/Rituals"
          className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors tracking-wide"
        >
          ← Kembali ke Rituals
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-[#0A0A0A] text-white font-sans min-h-screen flex items-center justify-center px-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <LuLoader className="w-8 h-8 text-[#C5A059] animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
