import { LuUser, LuCalendar } from "react-icons/lu";

const historyData = [
  {
    id: 1,
    service: "Haircut",
    price: "RP 50.000",
    barber: "Ujang",
    date: "Oct 25, 2026",
    status: "RESERVED"
  },
  {
    id: 2,
    service: "Haircut",
    price: "RP 50.000",
    barber: "Julian",
    date: "Oct 12, 2026",
    status: "COMPLETED"
  },
  {
    id: 3,
    service: "Haircut",
    price: "RP 50.000",
    barber: "Julian",
    date: "Sep 28, 2026",
    status: "COMPLETED"
  },
  {
    id: 4,
    service: "Hair colouring",
    price: "RP 120.000",
    barber: "Ujang",
    date: "Aug 15, 2026",
    status: "COMPLETED"
  },
  {
    id: 5,
    service: "Hair Perm",
    price: "RP 200.000",
    barber: "Julian",
    date: "Jul 02, 2026",
    status: "COMPLETED"
  }
];

export default function HistoryPage() {
  return (
    <div className="bg-[#0A0A0A] text-white font-sans min-h-screen">
      <div className="max-w-6xl mx-auto md:px-6">
        {/* 1. Header Section */}
        <section className="px-6 md:px-0 pt-10 pb-12 md:pt-20 md:pb-24">
          <span className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase block mb-3">
            YOUR JOURNEY
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6">Booking<br />History</h1>
          <div className="w-16 h-1 bg-[#C5A059]"></div>
        </section>

        {/* 2. History List */}
        <section className="px-6 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyData.map((item) => (
            <div key={item.id} className={`bg-[#141414] rounded-2xl p-6 border shadow-xl transition-all duration-300 hover:bg-zinc-900/50 hover:scale-[1.02] ${item.status === 'RESERVED' ? 'border-[#C5A059]/30' : 'border-zinc-900'}`}>
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-serif text-white">{item.service}</h3>
                <span className="text-[#C5A059] font-bold text-lg">{item.price}</span>
              </div>

              {/* Barber Info */}
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-6">
                <LuUser size={14} className="text-[#C5A059]" />
                <span>Barber: {item.barber}</span>
              </div>

              {/* Separator */}
              <div className="h-[1px] bg-zinc-800/50 mb-6"></div>

              {/* Card Footer */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <LuCalendar size={14} className="text-zinc-500" />
                  <span>{item.date}</span>
                </div>
                <div className={`px-4 py-1.5 bg-zinc-900/50 border rounded-md flex items-center gap-2 ${item.status === 'RESERVED' ? 'border-[#C5A059]/50' : 'border-zinc-800'}`}>
                  <span className={`text-[10px] font-bold tracking-widest ${item.status === 'RESERVED' ? 'text-[#C5A059]' : 'text-zinc-500'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}



