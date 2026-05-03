"use client";

import { useState, useEffect } from "react";
import { LuPlus, LuMinus, LuPencil, LuLogOut, LuLogIn, LuUser, LuX, LuLock, LuLoader } from "react-icons/lu";
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
    question: "Bagaimana cara melakukan konfirmasi pembayaran?",
    answer: "Setelah melakukan transfer sesuai nominal, Anda wajib mengunggah bukti pembayaran di halaman 'Rituals'. Admin kami akan memverifikasi bukti tersebut maksimal 15 menit agar status reservasi Anda berubah menjadi 'Confirmed'."
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
  
  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password minimal harus 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    setIsUpdating(false);

    if (error) {
      setError(error.message);
    } else {
      alert("Password berhasil diperbarui!");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    }
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
            {/* Hide edit profile picture button for now */}
            {/* {session && (
              <button className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#C5A059] transition-all">
                <LuPencil size={14} />
              </button>
            )} */}
          </div>

          <div className="text-center">
            {session ? (
              <>
                <h1 className="text-4xl md:text-6xl font-serif text-[#C5A059] mb-2">{userName}</h1>
                <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-1">
                  ACCOUNT ID: {accountId}
                </p>
                <p className="text-zinc-600 text-[10px] md:text-xs mb-6">{userEmail}</p>

                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center gap-2 text-[#C5A059] border border-[#C5A059]/30 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-[#C5A059] hover:text-black transition-all"
                >
                  <LuLock size={12} />
                  GANTI PASSWORD
                </button>
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
          <div className="mb-10 text-left max-w-2xl mx-auto">
            <h2 className="text-lg md:text-2xl font-serif text-white mb-4 uppercase tracking-wider">Frequently Asked Questions</h2>
            <div className="w-full h-[2px] bg-[#C5A059]"></div>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-[#141414] rounded-xl overflow-hidden transition-all duration-300 border border-zinc-900/50 hover:border-[#C5A059]/20">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 flex justify-between items-center text-left"
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
                  ${openFaq === index ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0'}
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

      {/* 4. Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isUpdating && setShowPasswordModal(false)}></div>
          <div className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-800/50">
              <h3 className="text-xl font-serif text-[#C5A059]">Ganti Password</h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                disabled={isUpdating}
                className="text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
              >
                <LuX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-[#E5C158] text-black py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shadow-lg shadow-[#E5C158]/10 flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
              >
                {isUpdating ? <LuLoader className="w-4 h-4 animate-spin" /> : "PERBARUI PASSWORD"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
