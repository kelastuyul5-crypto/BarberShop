"use client";

import { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { LuUpload, LuX } from "react-icons/lu";
import { DayPicker } from "react-day-picker";
import { format, addDays, startOfToday } from "date-fns";
import { id } from "date-fns/locale";
import "react-day-picker/dist/style.css";

export default function RitualsPage() {
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const today = startOfToday();
  const maxDate = addDays(today, 7);

  const handleCancel = () => {
    setSelectedBarber(null);
    setSelectedTime(null);
    setSelectedServices([]);
    setUploadedFile(null);
    setSelectedDate(new Date());
  };

  const servicePrices: Record<string, number> = {
    "Haircut": 50000,
    "Colouring": 120000,
    "Hair Perm": 200000
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const timeSlotClass = (time: string) => `
    px-5 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
    ${selectedTime === time
      ? "bg-[#E5C158] text-black font-bold"
      : "border border-zinc-800 text-white hover:border-zinc-600"}
  `;

  const serviceClass = (service: string) => `
    px-5 py-2.5 rounded-lg text-xs font-medium transition-all duration-300
    ${selectedServices.includes(service)
      ? "bg-[#E5C158] text-black font-bold"
      : "border border-zinc-800 text-white hover:border-zinc-600"}
  `;

  return (
    <div className="bg-[#0A0A0A] text-white font-sans overflow-x-hidden min-h-screen">
      <div className="max-w-6xl mx-auto md:px-6">
        <div className="md:grid md:grid-cols-2 md:gap-16 md:pt-12">
          {/* LEFT COLUMN: Date & Calendar */}
          <div className="space-y-8">
            {/* 1. Header Section */}
            <section className="px-6 md:px-0 pt-6">

              <h1 className="text-3xl md:text-5xl font-serif text-white">Pilih Tanggal<br />Booking</h1>
            </section>

            {/* 2. Calendar */}
            <section className="px-6 md:px-0">
              <div className="bg-[#1A1A1A] rounded-2xl p-6 flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={{ before: today, after: maxDate }}
                  locale={id}
                  disableNavigation
                  hideNavigation
                  classNames={{
                    months: "w-full",
                    month: "w-full",
                    month_caption: "flex justify-center items-center mb-6",
                    caption_label: "text-sm font-serif",
                    month_grid: "w-full border-collapse",
                    weekday: "text-[#C5A059] text-[10px] font-bold py-2 text-center",
                    weekdays: "grid grid-cols-7 mb-2",
                    weeks: "grid grid-cols-1 gap-y-2",
                    week: "grid grid-cols-7",
                    day: "w-8 h-8 flex items-center justify-center text-xs text-white hover:bg-zinc-800 rounded-lg transition-colors mx-auto",
                    selected: "bg-[#E5C158] text-black font-bold",
                    disabled: "text-zinc-600 cursor-not-allowed opacity-60",
                    today: "border border-[#E5C158]/30",
                  }}
                />
              </div>
            </section>

            {/* 3. Weekend Premium Info */}
            <section className="px-6 md:px-0">
              <div className="bg-[#1A1A1A] rounded-xl p-4 flex gap-4 border-l-2 border-[#E5C158]">
                <div className="mt-0.5 shrink-0">
                  <div className="w-4 h-5 border border-[#E5C158] rounded-[3px] flex items-center justify-center">
                    <span className="text-[#E5C158] text-[8px] font-bold">×</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-white text-xs font-bold mb-1">Weekend Premium</h3>
                  <p className="text-zinc-400 text-[10px] leading-relaxed">
                    Setiap reservasi di hari Sabtu dan Minggu sudah termasuk complimentary artisanal drink, disajikan eksklusif langsung dari private stash kami.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Selection Details */}
          <div className="space-y-12 mt-12 md:mt-0">
            {/* 4. Jadwal Tersedia */}
            <section className="px-6 md:px-0">
              <h2 className="text-2xl font-serif text-white mb-6">Jadwal Tersedia</h2>

              <div className="space-y-6">
                {/* Pagi */}
                <div>
                  <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">RITUAL PAGI</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setSelectedTime("09:00 AM")} className={timeSlotClass("09:00 AM")}>09:00 AM</button>
                    <button onClick={() => setSelectedTime("10:00 AM")} className={timeSlotClass("10:00 AM")}>10:00 AM</button>
                    <button onClick={() => setSelectedTime("11:00 AM")} className={timeSlotClass("11:00 AM")}>11:00 AM</button>
                  </div>
                </div>

                {/* Siang */}
                <div>
                  <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">RITUAL SIANG</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setSelectedTime("12:30 PM")} className={timeSlotClass("12:30 PM")}>12:30 PM</button>
                    <button onClick={() => setSelectedTime("01:30 PM")} className={timeSlotClass("01:30 PM")}>01:30 PM</button>
                    <button onClick={() => setSelectedTime("02:30 PM")} className={timeSlotClass("02:30 PM")}>02:30 PM</button>
                    <button onClick={() => setSelectedTime("03:30 PM")} className={timeSlotClass("03:30 PM")}>03:30 PM</button>
                    <button onClick={() => setSelectedTime("04:30 PM")} className={timeSlotClass("04:30 PM")}>04:30 PM</button>
                  </div>
                </div>

                {/* Sore */}
                <div>
                  <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">SORE SANTAI</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setSelectedTime("06:00 PM")} className={timeSlotClass("06:00 PM")}>06:00 PM</button>
                    <button onClick={() => setSelectedTime("07:00 PM")} className={timeSlotClass("07:00 PM")}>07:00 PM</button>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Scheduled With */}
            <section className="px-6 md:px-0 space-y-4">
              <h2 className="text-2xl font-serif text-white mb-6">Pilih Barber</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Barber Card 1: Danang Maulana */}
                <div
                  onClick={() => setSelectedBarber(selectedBarber === "Danang Maulana" ? null : "Danang Maulana")}
                  className={`
                    bg-[#1A1A1A] rounded-xl overflow-hidden flex md:flex-col h-[104px] md:h-auto relative cursor-pointer transition-all duration-300
                    hover:bg-zinc-800 active:scale-[0.98]
                    ${selectedBarber && selectedBarber !== "Danang Maulana" ? 'opacity-30 grayscale' : 'opacity-100'}
                    ${selectedBarber === "Danang Maulana" ? 'ring-1 ring-[#E5C158] bg-zinc-800' : ''}
                  `}
                >
                  <div className="w-[104px] md:w-full md:aspect-[4/3] shrink-0 bg-zinc-800 relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent"></div>
                  </div>
                  <div className="flex-1 py-3 pl-4 pr-3 flex flex-col justify-center">
                    <span className="text-[#C5A059] text-[8px] font-bold tracking-[0.2em] uppercase mb-1">SCHEDULED WITH</span>
                    <h3 className="text-lg font-serif text-white mb-1">Danang Maulana</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight">Master Barber<br />Specialist</p>
                  </div>
                </div>

                {/* Barber Card 2: Ujang Mawang */}
                <div
                  onClick={() => setSelectedBarber(selectedBarber === "Ujang Mawang" ? null : "Ujang Mawang")}
                  className={`
                    bg-[#1A1A1A] rounded-xl overflow-hidden flex md:flex-col h-[104px] md:h-auto relative cursor-pointer transition-all duration-300
                    hover:bg-zinc-800 active:scale-[0.98]
                    ${selectedBarber && selectedBarber !== "Ujang Mawang" ? 'opacity-30 grayscale' : 'opacity-100'}
                    ${selectedBarber === "Ujang Mawang" ? 'ring-1 ring-[#E5C158] bg-zinc-800' : ''}
                  `}
                >
                  <div className="w-[104px] md:w-full md:aspect-[4/3] shrink-0 bg-zinc-800 relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent"></div>
                  </div>
                  <div className="flex-1 py-3 pl-4 pr-3 flex flex-col justify-center">
                    <span className="text-[#C5A059] text-[8px] font-bold tracking-[0.2em] uppercase mb-1">SCHEDULED WITH</span>
                    <h3 className="text-lg font-serif text-white mb-1">Ujang Mawang</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight">Senior Grooming<br />Specialist</p>
                  </div>
                </div>

                {/* Barber Card 3: Julian Tompel */}
                <div
                  onClick={() => setSelectedBarber(selectedBarber === "Julian Tompel" ? null : "Julian Tompel")}
                  className={`
                    bg-[#1A1A1A] rounded-xl overflow-hidden flex md:flex-col h-[104px] md:h-auto relative cursor-pointer transition-all duration-300
                    hover:bg-zinc-800 active:scale-[0.98]
                    ${selectedBarber && selectedBarber !== "Julian Tompel" ? 'opacity-30 grayscale' : 'opacity-100'}
                    ${selectedBarber === "Julian Tompel" ? 'ring-1 ring-[#E5C158] bg-zinc-800' : ''}
                  `}
                >
                  <div className="w-[104px] md:w-full md:aspect-[4/3] shrink-0 bg-zinc-800 relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent"></div>
                  </div>
                  <div className="flex-1 py-3 pl-4 pr-3 flex flex-col justify-center">
                    <span className="text-[#C5A059] text-[8px] font-bold tracking-[0.2em] uppercase mb-1">SCHEDULED WITH</span>
                    <h3 className="text-lg font-serif text-white mb-1">Julian Tompel</h3>
                    <p className="text-zinc-500 text-[10px] leading-tight">Senior Grooming<br />Specialist</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Services */}
            <section className="px-6 md:px-0 pb-6">
              <h2 className="text-2xl font-serif text-white mb-6">Services</h2>

              <div>
                <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">PILIH LAYANAN</h3>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => toggleService("Haircut")} className={serviceClass("Haircut")}>Haircut</button>
                  <button onClick={() => toggleService("Colouring")} className={serviceClass("Colouring")}>Colouring</button>
                  <button onClick={() => toggleService("Hair Perm")} className={serviceClass("Hair Perm")}>Hair Perm</button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* 7. Bottom Actions */}
        <section className="px-6 pt-8 pb-0 mt-6 border-t border-zinc-800/50 flex justify-between items-center bg-[#0A0A0A] rounded-2xl">
          <button
            onClick={handleCancel}
            className="text-zinc-400 text-xs font-bold tracking-[0.1em] uppercase hover:text-white transition-colors"
          >
            CANCEL RITUAL
          </button>
          <button
            onClick={() => {
              if (selectedTime && selectedBarber && selectedServices.length > 0 && selectedDate) {
                setShowPaymentModal(true);
              } else {
                alert("Mohon lengkapi pilihan tanggal, barber, dan minimal satu layanan terlebih dahulu.");
              }
            }}
            className="bg-[#E5C158] text-black px-12 py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shadow-lg shadow-[#E5C158]/10"
          >
            CONFIRM BOOKING
          </button>
        </section>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
          <div className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-800/50">
              <h3 className="text-xl font-serif text-[#C5A059]">Detail Pesanan</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <LuX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Jadwal</span>
                  <span className="text-white text-sm font-medium">
                    {selectedDate ? format(selectedDate, "dd MMMM yyyy", { locale: id }) : ""} - {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Barber</span>
                  <span className="text-white text-sm font-medium">{selectedBarber}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-zinc-500 text-xs mt-1">Layanan</span>
                  <div className="flex flex-col items-end gap-1">
                    {selectedServices.map(service => (
                      <span key={service} className="text-white text-sm font-medium">{service}</span>
                    ))}
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-[#C5A059] text-xs font-bold uppercase tracking-wider">Total Bayar</span>
                  <span className="text-[#C5A059] text-lg font-bold font-mono">
                    RP {selectedServices.reduce((sum, s) => sum + (servicePrices[s] || 0), 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Bank Account Info */}
              <div>
                <h4 className="text-xs font-bold tracking-[0.1em] text-zinc-400 uppercase mb-3">Transfer Pembayaran</h4>
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#C5A059]/30 flex flex-col items-center justify-center gap-2">
                  <span className="text-zinc-400 text-xs">Bank Central Asia (BCA)</span>
                  <span className="text-2xl font-mono text-[#C5A059] tracking-widest font-bold">10xx-xxxx-xxxx</span>
                  <span className="text-zinc-500 text-xs">a.n Barbershop Heritage</span>
                </div>
              </div>

              {/* Upload Proof */}
              <div>
                <h4 className="text-xs font-bold tracking-[0.1em] text-zinc-400 uppercase mb-3">Upload Bukti Transfer</h4>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-[#1A1A1A] hover:bg-zinc-900 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <LuUpload className="w-8 h-8 mb-3 text-zinc-500" />
                    <p className="mb-2 text-sm text-zinc-400">
                      <span className="font-semibold text-[#C5A059]">Klik untuk upload</span> atau drag and drop
                    </p>
                    <p className="text-xs text-zinc-600">SVG, PNG, JPG (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  />
                </label>
                {uploadedFile && (
                  <p className="mt-2 text-xs text-green-500 text-center">
                    File terpilih: {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-800/50">
              <button
                onClick={() => {
                  alert("Pesanan Anda telah dikirim ke Admin untuk konfirmasi!");
                  setShowPaymentModal(false);
                }}
                disabled={!uploadedFile}
                className="w-full bg-[#E5C158] disabled:opacity-50 disabled:cursor-not-allowed text-black py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shadow-lg shadow-[#E5C158]/10"
              >
                KIRIM KE ADMIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


