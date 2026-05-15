import { RiHistoryLine, RiUser3Line } from "react-icons/ri";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import Link from "next/link";

export default function JournalPage() {
  return (
    <div className="bg-[#0A0A0A] text-white font-sans overflow-x-hidden min-h-screen">
      {/* 1. Hero Section */}
      <section className="px-6 py-12 md:py-24 border-b border-[#C5A059]/10">
        <div className="max-w-6xl mx-auto md:flex md:items-center md:gap-12">
          <div className="md:flex-1">
            <h1 className="text-4xl md:text-7xl font-serif text-white mb-6">Ritual Kami</h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-6 max-w-md">
              Rangkaian layanan eksklusif yang dirancang khusus untuk pria yang menginginkan lebih dari sekadar tata rambut.
            </p>
            <Link href="/Rituals" className="text-[#C5A059] text-xs font-bold tracking-[0.2em] border-b border-[#C5A059] pb-1 hover:opacity-80 transition-opacity uppercase inline-block">
              BOOK NOW
            </Link>
          </div>
          <div className="hidden md:block md:flex-1 h-[400px] bg-zinc-900 border border-[#C5A059]/10 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
          </div>
        </div>
      </section>

      {/* 2. Carousel Section (Hair Stylist) */}
      <section className="py-12 md:py-24 border-b border-[#C5A059]/10">
        <div className="max-w-6xl mx-auto">
          <div className="px-6 mb-8 md:mb-16">
            <span className="text-[#C5A059] text-[10px] font-bold tracking-[0.3em] uppercase block mb-2">
              — OUR PROFESSION —
            </span>
            <h2 className="text-3xl md:text-5xl font-serif text-white">Hair Stylist</h2>
          </div>

          {/* Carousel / Grid on Desktop */}
          <div className="flex md:grid md:grid-cols-3 overflow-x-auto gap-6 px-6 no-scrollbar pb-4">
            <div className="min-w-[280px] md:min-w-0 group">
              <div className="aspect-[3/4] bg-zinc-900 border border-[#C5A059]/20 flex items-center justify-center mb-4 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80" 
                  alt="Danang Maulana" 
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <h3 className="text-xl font-serif text-white mb-1">Danang Maulana</h3>
              <p className="text-[#C5A059] text-[10px] font-bold tracking-widest mb-3 uppercase">MASTER BARBER SPECIALIST</p>
              <p className="text-zinc-500 text-xs leading-relaxed italic">
                "With years of experience specializing in classic silhouettes and modern textures"
              </p>
            </div>

            <div className="min-w-[280px] md:min-w-0 group">
              <div className="aspect-[3/4] bg-zinc-900 border border-[#C5A059]/20 flex items-center justify-center mb-4 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80" 
                  alt="Ujang Mawang" 
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <h3 className="text-xl font-serif text-white mb-1">Ujang Mawang</h3>
              <p className="text-[#C5A059] text-[10px] font-bold tracking-widest mb-3 uppercase">Senior Grooming Specialist</p>
              <p className="text-zinc-500 text-xs leading-relaxed italic">
                "Specialist in beard grooming and traditional hot towel shaves."
              </p>
            </div>

            <div className="min-w-[280px] md:min-w-0 group">
              <div className="aspect-[3/4] bg-zinc-900 border border-[#C5A059]/20 flex items-center justify-center mb-4 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80" 
                  alt="Julian Tompel" 
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <h3 className="text-xl font-serif text-white mb-1">Julian Tompel</h3>
              <p className="text-[#C5A059] text-[10px] font-bold tracking-widest mb-3 uppercase">Senior Grooming Specialist</p>
              <p className="text-zinc-500 text-xs leading-relaxed italic">
                "Expert in contemporary styles and creative hair design."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Atelier Story */}
      <section className="px-6 py-12 md:py-24 border-b border-[#C5A059]/10">
        <div className="max-w-6xl mx-auto md:grid md:grid-cols-2 md:gap-20 md:items-center">
          <div>
            <span className="text-[#C5A059] text-[10px] font-bold tracking-[0.3em] uppercase block mb-2">
              — OUR JOURNEY —
            </span>
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-4">The Atelier Story</h2>
            <div className="w-12 h-[2px] bg-[#C5A059] mb-8" />
            
            <p className="text-[#C5A059] font-serif text-lg md:text-2xl italic leading-relaxed mb-8">
              "Extraordinary colour from doors down, and the craft masters SHP.M"
            </p>
            
            <div className="space-y-6 text-zinc-400 text-sm md:text-base leading-relaxed mb-12">
              <p>
                Didirikan di tahun 1998, The Atelier bermula dari sebuah ruangan kecil di sudut kota yang menjanjikan ketelitian dan dedikasi pada setiap helai rambut. Selama beberapa generasi, kami telah dipercaya menjaga penampilan para pria, tidak hanya sekadar tren sesaat, namun sebuah gaya hidup yang abadi.
              </p>
              <p>
                Setiap pelanggan adalah individu dengan karakter unik, dan kami memahami bahwa setiap potongan rambut harus mencerminkan kepribadian tersebut. Dari gaya klasik hingga potongan modern, kami memadukan teknik tradisional dengan sentuhan masa kini untuk menciptakan gaya yang tak lekang oleh waktu.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] bg-zinc-900 border border-[#C5A059]/20 flex items-center justify-center overflow-hidden relative">
               <img src="/images/atelier-story-1.png" className="w-full h-full object-cover opacity-50 hover:opacity-80 transition-opacity duration-500" alt="Atelier Story Image 1" />
            </div>
            <div className="aspect-[3/4] bg-zinc-900 border border-[#C5A059]/20 flex items-center justify-center overflow-hidden translate-y-8 relative">
               <img src="/images/atelier-story-2.png" className="w-full h-full object-cover opacity-50 hover:opacity-80 transition-opacity duration-500" alt="Atelier Story Image 2" />
            </div>
          </div>
        </div>
        <div className="h-8 md:h-24"></div>
      </section>

      {/* 4. Established 1924 */}
      <section className="px-6 py-12 md:py-24 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-20">
            <span className="text-[#C5A059] text-[10px] font-bold tracking-[0.3em] uppercase block mb-2">
              OUR LEGACY
            </span>
            <h2 className="text-4xl md:text-6xl font-serif text-white italic">Established 1998</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 mb-16 md:mb-32">
            <div>
              <h4 className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">TRADITION</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Menjaga warisan metode klasik dengan teliti, memastikan esensi tata pangkas tetap hidup pada setiap sentuhan.
              </p>
            </div>
            <div>
              <h4 className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">DEDICATION</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Komitmen penuh kami dalam memberikan pelayanan terbaik, karena bagi kami ini bukan sekedar pekerjaan melainkan panggilan jiwa.
              </p>
            </div>
            <div>
              <h4 className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase mb-4">CRAFTSMANSHIP</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Setiap detail adalah perwujudan seni, dari pemilihan sisir hingga sudut gunting yang paling tepat demi hasil yang presisi.
              </p>
            </div>
          </div>

          <div className="relative pt-12 md:pt-24 border-t border-[#C5A059]/10 px-4 md:max-w-3xl md:mx-auto text-center">
            <span className="absolute top-8 md:top-16 left-0 md:left-[-20px] text-6xl md:text-8xl font-serif text-[#C5A059]/20">"</span>
            <p className="text-zinc-300 font-serif italic text-lg md:text-3xl leading-relaxed mb-6 relative z-10 pl-6 md:pl-0">
              "The barbershop is the cornerstone of the modern man's routine. The tools are our instruments and our customers the canvas."
            </p>
            <p className="text-[#C5A059] text-[10px] font-bold tracking-widest uppercase pl-6 md:pl-0">
              — THE FOUNDERS ATELIER, 1998
            </p>
          </div>
        </div>
      </section>

      {/* 5. Heritage Atelier / Footer Section */}
      <section className="px-6 pt-16 pb-8 md:pt-32 border-t border-[#C5A059]/10">
        <div className="max-w-6xl mx-auto">
          <div className="md:grid md:grid-cols-4 md:gap-12">
            <div className="mb-10 md:mb-0 md:col-span-1">
              <h3 className="text-[#C5A059] font-serif text-lg tracking-[0.2em] mb-4 uppercase">HERITAGE ATELIER</h3>
              <p className="text-zinc-500 text-xs leading-relaxed italic">
                "Kami bukan hanya sekadar tempat pangkas rambut. Kami adalah penjaga warisan gaya pria dari generasi ke generasi, meneruskan kebanggaan...."
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs md:col-span-3">
              <div>
                <p className="text-white font-bold mb-3 uppercase tracking-widest">STUDIO</p>
                <p className="text-zinc-500 leading-relaxed">
                  123 Heritage Street,<br />
                  North Ave, Palembang<br />
                  +62 812 3456 789
                </p>
              </div>
              <div>
                <p className="text-white font-bold mb-3 uppercase tracking-widest">JADWAL OPERASI</p>
                <p className="text-zinc-500 leading-relaxed">
                  Senin - Minggu: 09.00 - 20.00
                </p>
              </div>
              <div>
                <p className="text-white font-bold mb-3 uppercase tracking-widest">SOCIAL</p>
                <div className="flex gap-4">
                  <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#C5A059] hover:border-[#C5A059] transition-colors">
                    <FaFacebookF size={12} />
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#C5A059] hover:border-[#C5A059] transition-colors">
                    <FaTwitter size={12} />
                  </a>
                  <a href="#" className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#C5A059] hover:border-[#C5A059] transition-colors">
                    <FaInstagram size={12} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 md:mt-24 border-t border-[#C5A059]/10 pt-6 flex flex-col md:flex-row md:justify-between gap-4 text-[10px] text-zinc-600 uppercase tracking-wider">
            <p>© 2024 THE ATELIER. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
}



