"use client";

import { useState } from "react";
import { LuPlus, LuMinus, LuPencil, LuLogOut } from "react-icons/lu";

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

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-[#0A0A0A] text-white font-sans min-h-screen">
      <div className="max-w-4xl mx-auto md:px-6">
        {/* 1. Profile Section */}
        <section className="flex flex-col items-center pt-12 pb-16 md:pt-24 md:pb-24 px-6">
          <div className="relative mb-8">
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-2 border-[#C5A059] p-1 overflow-hidden transition-all duration-500">
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <button className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-[#C5A059] transition-all">
              <LuPencil size={14} />
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-serif text-[#C5A059] mb-2">Arthur Dent</h1>
            <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
              ACCOUNT ID: HA-2023-X99L2
            </p>
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

        {/* 3. Logout Section */}
        <section className="px-6 md:px-0 mt-12 mb-2">
          <button className="w-full max-w-xs mx-auto py-4 bg-[#141414] border border-zinc-900 rounded-xl flex items-center justify-center gap-3 text-red-500 hover:bg-red-500/5 hover:border-red-500/30 transition-all duration-300 group">
            <LuLogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">LOG OUT</span>
          </button>
        </section>
      </div>
    </div>
  );
}
