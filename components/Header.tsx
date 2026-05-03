"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiProfileLine } from "react-icons/ri";
import { supabase } from "@/utils/supabase";
import type { Session } from "@supabase/supabase-js";

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-[#C5A059]/20 px-6 py-4 flex items-center justify-between">
      {/* Left spacer */}
      <div className="w-10" />

      {/* Centered Logo */}
      <div className="flex flex-col items-center">
        <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">
          HERITAGE
        </span>
        <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">
          ATELIER
        </span>
      </div>

      {/* Right: Auth-dependent */}
      {isLoading ? (
        <div className="w-10 h-10" />
      ) : session ? (
        /* Authenticated: Profile Icon */
        <Link href="/Profile">
          <div className="relative w-10 h-10 rounded-full border border-[#C5A059]/50 overflow-hidden flex items-center justify-center bg-[#1a1a1a] hover:border-[#C5A059] transition-colors cursor-pointer">
            <RiProfileLine className="w-6 h-6 text-[#C5A059]" />
          </div>
        </Link>
      ) : (
        /* Guest: Log In text */
        <Link
          href={`/login?redirect=${pathname}`}
          className="text-[#C5A059] text-xs font-bold tracking-[0.15em] uppercase hover:text-[#E5C158] transition-colors duration-300"
        >
          Log In
        </Link>
      )}
    </header>
  );
}
