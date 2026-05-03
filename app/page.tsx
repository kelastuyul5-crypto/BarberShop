"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function redirectUser() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
          
        if (profile?.role === "admin") {
          router.replace("/admin");
          return;
        }
      }
      
      router.replace("/Journal");
    }
    
    redirectUser();
  }, [router]);

  return (
    <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center">
      {/* Optional loading state while redirecting */}
    </div>
  );
}
