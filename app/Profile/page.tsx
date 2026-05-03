"use client";

import { useState, useEffect } from "react";
import { LuPlus, LuMinus, LuPencil, LuLogOut, LuLogIn, LuUser } from "react-icons/lu";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

const faqData = [
  {
    question: "Bagaimana cara mengelola reservasi saya?",
    answer: "Anda dapat melihat dan mengelola semua reservasi aktif maupun riwayat di halaman 'History'. Untuk pembatalan, pastikan dilakukan minimal 2 jam sebelum jadwal yang ditentukan."
  },
  {
    question: "Apa keuntungan menjadi Member Heritage?",
    answer: "Sebagai Member Heritage, Anda mendapatkan prioritas booking, minuman artisanal gratis di setiap ritual akhir pekan, serta poin loyalitas yang dapat ditukar dengan layanan eksklusif."
  },
  {
    question: "Bisakah saya meminta barber tertentu?",
    answer: "Tentu saja. Di halaman 'Rituals', Anda memiliki kebebasan untuk memilih master barber favorit Anda, seperti Ujang Mawang atau Julian Tompel, sebelum mengonfirmasi pesanan."
  },
  {
    question: "Bagaimana kebijakan pembatalan & modifikasi?",
    answer: "Pembatalan tanpa biaya tersedia hingga 2 jam sebelum jadwal. Untuk modifikasi waktu, Anda dapat melakukannya melalui sistem kami selama slot barber masih tersedia di hari yang sama."
  }
];

export default function ProfilePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/Rituals");
  };

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "User";
  const userEmail = session?.user?.email || "";
  const accountId = session?.user?.id ? `HA-${session.user.id.substring(0, 8).toUpperCase()}` : "";

  if (isLoading) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] text-white font-sans min-h-screen pb-20">
      <div className="max-w-4xl mx-auto md:px-6">
        {/* 1. Profile Section */}
        <section className="flex flex-col items-center pt-12 pb-16 md:pt-24 md:pb-24 px-6">
          <div className="relative mb-8">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-2 border-[#C5A059] p-1 overflow-hidden transition-all duration-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                {session ? (
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}&backgroundColor=1a1a1a&textColor=C5A059`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  /* Guest: Empty default avatar */
                  <LuUser className="w-16 h-16 md:w-24 md:h-24 text-zinc-600" />
                )}
              </div>
            </div>
            {session && (
              <button className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#C5A059] transition-all">
                <LuPencil size={14} />
              </button>
            )}
          </div>

          <div className="text-center">
            {session ? (
              <>
                <h1 className="text-4xl md:text-6xl font-serif text-[#C5A059] mb-2">{userName}</h1>
                <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-1">
                  ACCOUNT ID: {accountId}
                </p>
                <p className="text-zinc-600 text-[10px] md:text-xs">{userEmail}</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-serif text-zinc-500 mb-4">Guest</h1>
                <Link
                  href="/login?redirect=/Profile"
                  className="inline-flex items-center gap-2 bg-[#E5C158] text-black px-8 py-3 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shadow-lg shadow-[#E5C158]/10"
                >
                  <LuLogIn size={16} />
                  LOG IN NOW
                </Link>
              </>
            )}
          </div>
        </section>

        {/* 2. FAQ Section */}
        <section className="px-6 md:px-0">
          <div className="mb-8">
            <h2 className="text-4xl font-serif text-white mb-4">FAQ</h2>
            <div className="w-full h-[1px] bg-zinc-800"></div>
          </div>

          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {faqData.map((faq, index) => (
              <div key={index} className={`bg-[#141414] rounded-xl overflow-hidden transition-all duration-300 border border-zinc-900/50 hover:border-[#C5A059]/20 ${openFaq === index ? 'md:col-span-2' : ''}`}>
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left h-full"
                >
                  <span className="text-zinc-200 text-sm font-medium leading-relaxed pr-4">
                    {faq.question}
                  </span>
                  <div className="shrink-0 text-zinc-500">
                    {openFaq === index ? <LuMinus size={20} /> : <LuPlus size={20} />}
                  </div>
                </button>
                
                <div className={`
                  px-6 overflow-hidden transition-all duration-300 ease-in-out
                  ${openFaq === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}
                `}>
                  <p className="text-zinc-500 text-xs md:text-sm leading-relaxed border-t border-zinc-800/50 pt-4">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Logout Section — Only for authenticated users */}
        {session && (
          <section className="px-6 md:px-0 mt-12 mb-2">
            <button
              onClick={handleLogout}
              className="w-full max-w-xs mx-auto py-4 bg-[#141414] border border-zinc-900 rounded-xl flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/5 hover:border-red-500/30 transition-all duration-300 group"
            >
              <LuLogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">LOG OUT</span>
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
