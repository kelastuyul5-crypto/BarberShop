"use client";

import { useState, useEffect } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { LuUpload, LuX, LuLoader, LuLogIn } from "react-icons/lu";
import { DayPicker } from "react-day-picker";
import { format, addDays, startOfToday } from "date-fns";
import { id } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import { getBarbers, getServices, checkAvailability, createBookingHold, checkUserActiveBooking, submitPaymentProof, getClosedDates, getAbsentBarbers, getServicesForBarber } from "@/app/actions/booking";
import Link from "next/link";
import { supabase } from "@/utils/supabase";

export default function RitualsPage() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const [selectedBarber, setSelectedBarber] = useState<any | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [absentBarbers, setAbsentBarbers] = useState<string[]>([]);
  const [closedDates, setClosedDates] = useState<Date[]>([]);
  const [isCheckingTime, setIsCheckingTime] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("15:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const today = startOfToday();
  const maxDate = addDays(today, 3);

  // Fetch initial data + session
  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || null;
      setUserId(uid);

      const fetchList: [Promise<any>, Promise<any>, Promise<any>?] = [
        getBarbers(),
        getClosedDates(),
      ];
      if (uid) fetchList.push(checkUserActiveBooking(uid));

      const results = await Promise.all(fetchList);
      setBarbers(results[0]);
      // services tidak di-fetch global lagi; akan di-fetch saat barber dipilih
      
      const parsedClosedDates = (results[1] || []).map((dStr: string) => new Date(dStr));
      setClosedDates(parsedClosedDates);
      
      if (uid && results[2]) setHasActiveBooking(results[2].hasActive);
      setIsLoadingData(false);
    }
    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      if (session?.user?.id) setShowLoginModal(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch availability, absences, AND services saat date atau barber berubah
  useEffect(() => {
    async function loadAvailability() {
      if (selectedDate) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        
        // Fetch absences
        const absences = await getAbsentBarbers(dateStr);
        setAbsentBarbers(absences);

        // If selected barber is absent, deselect them
        if (selectedBarber && absences.includes(selectedBarber.id)) {
          setSelectedBarber(null);
          setServicesList([]);
          setSelectedServices([]);
          setBookedTimes([]);
          setSelectedTime(null);
          return;
        }

        if (selectedBarber) {
          setIsCheckingTime(true);
          const [times] = await Promise.all([
            checkAvailability(dateStr, selectedBarber.id),
          ]);
          setBookedTimes(times);
          setIsCheckingTime(false);
          // If selected time is now booked, clear it
          if (selectedTime && times.includes(selectedTime)) {
            setSelectedTime(null);
          }
        } else {
          setBookedTimes([]);
        }
      } else {
        setAbsentBarbers([]);
        setBookedTimes([]);
      }
    }
    loadAvailability();
  }, [selectedDate, selectedBarber]);

  // Fetch services untuk barber yang dipilih
  useEffect(() => {
    async function loadServices() {
      if (!selectedBarber) {
        setServicesList([]);
        setSelectedServices([]);
        return;
      }
      setIsLoadingServices(true);
      const svcs = await getServicesForBarber(selectedBarber.id);
      setServicesList(svcs);
      // Clear services yang tidak ada di barber baru
      setSelectedServices(prev => prev.filter(s => svcs.some((sv: any) => sv.id === s.id)));
      setIsLoadingServices(false);
    }
    loadServices();
  }, [selectedBarber]);

  // Countdown Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showPaymentModal && expiresAt) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(expiresAt).getTime();
        const distance = end - now;

        if (distance <= 0) {
          clearInterval(interval);
          setCountdown("00:00");
          alert("Waktu pembayaran telah habis. Silakan buat booking ulang.");
          setShowPaymentModal(false);
          handleCancel(); // Reset
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setCountdown(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, expiresAt]);

  const handleCancel = () => {
    setSelectedBarber(null);
    setSelectedTime(null);
    setSelectedServices([]);
    setUploadedFile(null);
    setSelectedDate(new Date());
  };

  const toggleService = (service: any) => {
    setSelectedServices(prev =>
      prev.find(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    );
  };

  const isTimePassed = (timeStr: string) => {
    if (!selectedDate) return false;
    const now = new Date();
    // Gunakan util format sederhana untuk perbandingan hari yang sama
    const todayStr = format(now, "yyyy-MM-dd");
    if (format(selectedDate, "yyyy-MM-dd") !== todayStr) return false;
    
    const timeMatch = timeStr.match(/(\d+):(\d+)/);
    if (!timeMatch) return false;
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    const selectedTimeMins = hours * 60 + minutes;
    const currentTimeMins = now.getHours() * 60 + now.getMinutes();
    
    return selectedTimeMins <= currentTimeMins;
  };

  const isTimeBooked = (time: string) => bookedTimes.includes(time);
  const isTimeDisabled = (time: string) => isTimeBooked(time) || isTimePassed(time);

  const timeSlotClass = (time: string) => `
    px-5 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 border
    ${isTimeDisabled(time) 
      ? "opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-500" 
      : selectedTime === time
        ? "bg-[#E5C158] border-transparent text-black font-bold"
        : "border-zinc-800 text-white hover:border-zinc-600"}
  `;

  const serviceClass = (serviceId: string) => `
    px-5 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 border
    ${selectedServices.find(s => s.id === serviceId)
      ? "bg-[#E5C158] border-transparent text-black font-bold"
      : "border-zinc-800 text-white hover:border-zinc-600"}
  `;

  const calculateTotal = () => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTime || !selectedBarber || selectedServices.length === 0 || !selectedDate) {
      alert("Mohon lengkapi pilihan tanggal, barber, jam, dan minimal satu layanan terlebih dahulu.");
      return;
    }

    // Guest gate: show login modal instead of processing
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Double check availability before creating hold
    const currentBookedTimes = await checkAvailability(dateStr, selectedBarber.id);
    if (currentBookedTimes.includes(selectedTime)) {
      alert("Maaf, jadwal ini baru saja dibooking orang lain.");
      setBookedTimes(currentBookedTimes);
      setSelectedTime(null);
      setIsSubmitting(false);
      return;
    }

    const input = {
      barberId: selectedBarber.id,
      date: dateStr,
      time: selectedTime,
      serviceIds: selectedServices.map(s => s.id),
      totalPrice: calculateTotal(),
      servicesWithPrices: selectedServices.map(s => ({ id: s.id, price: s.price }))
    };

    const res = await createBookingHold(input, userId);
    if (res.success && res.bookingId) {
      setBookingId(res.bookingId);
      setExpiresAt(res.expiresAt!);
      setHasActiveBooking(true);
      setShowPaymentModal(true);
    } else {
      alert("Gagal membuat booking: " + res.error);
    }
    setIsSubmitting(false);
  };

  const handleSubmitPayment = async () => {
    if (!uploadedFile || !bookingId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);

    const res = await submitPaymentProof(bookingId, formData);
    setIsUploading(false);

    if (res.success) {
      alert("Pesanan Anda telah dikirim ke Admin untuk konfirmasi!");
      setShowPaymentModal(false);
      handleCancel();
    } else {
      alert("Gagal mengupload bukti pembayaran: " + res.error);
    }
  };

  if (isLoadingData) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center text-[#C5A059]">
        <LuLoader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const morningSlots = ["09:00", "10:00", "11:00"];
  const noonSlots = ["12:30", "13:30", "14:30", "15:30", "16:30"];
  const eveningSlots = ["18:00", "19:00"];

  return (
    <div className="bg-[#0A0A0A] text-white font-sans overflow-x-hidden min-h-screen">
      <div className="max-w-6xl mx-auto md:px-6">

        {/* Anti-troll Warning Banner */}
        {hasActiveBooking && (
          <div className="mx-6 md:mx-0 mt-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex-1">
              <p className="text-orange-400 text-sm font-bold mb-1">⚠ Pesanan Belum Dibayar</p>
              <p className="text-zinc-400 text-xs leading-relaxed">Anda masih memiliki pesanan yang belum dibayar. Selesaikan pembayaran atau batalkan pesanan terlebih dahulu sebelum membuat booking baru.</p>
            </div>
            <Link
              href="/History"
              className="shrink-0 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-lg text-xs font-bold tracking-wider hover:bg-orange-500 hover:text-black transition-colors"
            >
              LIHAT HISTORY
            </Link>
          </div>
        )}

        <div className="md:grid md:grid-cols-2 md:gap-16 md:pt-12">
          {/* LEFT COLUMN: Date & Calendar */}
          <div className="space-y-8">
            <section className="px-6 md:px-0 pt-6">
              <h1 className="text-3xl md:text-5xl font-serif text-white">Pilih Tanggal<br />Booking</h1>
            </section>

            <section className="px-6 md:px-0">
              <div className="bg-[#1A1A1A] rounded-2xl p-6 flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                  }}
                  disabled={[{ before: today, after: maxDate }, ...closedDates]}
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
                    Setiap reservasi di hari Sabtu dan Minggu sudah termasuk complimentary artisanal drink.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Selection Details */}
          <div className="space-y-12 mt-12 md:mt-0">
            {/* Scheduled With */}
            <section className="px-6 md:px-0 space-y-4">
              <h2 className="text-2xl font-serif text-white mb-6">Pilih Barber</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {barbers.map(barber => {
                  const isAbsent = absentBarbers.includes(barber.id);
                  return (
                  <div
                    key={barber.id}
                    onClick={() => {
                      if (!isAbsent && selectedBarber?.id !== barber.id) {
                        setSelectedBarber(barber);
                        setSelectedTime(null);
                      }
                    }}
                    className={`
                      bg-[#1A1A1A] rounded-xl overflow-hidden flex md:flex-col h-[104px] md:h-auto relative transition-all duration-300
                      ${isAbsent ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer hover:bg-zinc-800 active:scale-[0.98]'}
                      ${selectedBarber && selectedBarber.id !== barber.id && !isAbsent ? 'opacity-30 grayscale' : ''}
                      ${selectedBarber?.id === barber.id ? 'ring-1 ring-[#E5C158] bg-zinc-800' : ''}
                    `}
                  >
                    <div className="w-[104px] md:w-full md:aspect-[4/3] shrink-0 bg-zinc-800 relative">
                      <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${barber.image_url}')`}}></div>
                      <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent"></div>
                    </div>
                    <div className="flex-1 py-3 pl-4 pr-3 flex flex-col justify-center">
                      <span className="text-[#C5A059] text-[8px] font-bold tracking-[0.2em] uppercase mb-1">SCHEDULED WITH</span>
                      <h3 className="text-lg font-serif text-white mb-1">{barber.name}</h3>
                      <p className="text-zinc-500 text-[10px] leading-tight">{barber.specialty}</p>
                      {isAbsent && <p className="text-red-500 text-[10px] font-bold mt-1.5 tracking-widest">SEDANG CUTI</p>}
                    </div>
                  </div>
                )})}
              </div>
            </section>

            {/* Jadwal Tersedia */}
            <section className="px-6 md:px-0">
              <h2 className="text-2xl font-serif text-white flex items-center gap-2 mb-6">
                Jadwal Tersedia
                {isCheckingTime && <LuLoader className="w-4 h-4 text-[#C5A059] animate-spin" />}
              </h2>
              
              {!selectedBarber ? (
                <p className="text-zinc-500 text-sm">Silakan pilih barber terlebih dahulu.</p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">RITUAL PAGI</h3>
                    <div className="flex flex-wrap gap-3">
                      {morningSlots.map(time => (
                        <button key={time} disabled={isTimeDisabled(time)} onClick={() => setSelectedTime(time)} className={timeSlotClass(time)}>{time}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">RITUAL SIANG</h3>
                    <div className="flex flex-wrap gap-3">
                      {noonSlots.map(time => (
                        <button key={time} disabled={isTimeDisabled(time)} onClick={() => setSelectedTime(time)} className={timeSlotClass(time)}>{time}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">SORE SANTAI</h3>
                    <div className="flex flex-wrap gap-3">
                      {eveningSlots.map(time => (
                        <button key={time} disabled={isTimeDisabled(time)} onClick={() => setSelectedTime(time)} className={timeSlotClass(time)}>{time}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Services */}
            <section className="px-6 md:px-0 pb-6">
              <h2 className="text-2xl font-serif text-white mb-6 flex items-center gap-2">
                Services
                {isLoadingServices && <LuLoader className="w-4 h-4 text-[#C5A059] animate-spin" />}
              </h2>
              <div>
                <h3 className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">PILIH LAYANAN</h3>
                {!selectedBarber ? (
                  <p className="text-zinc-600 text-sm">Pilih barber terlebih dahulu untuk melihat layanan yang tersedia.</p>
                ) : isLoadingServices ? (
                  <p className="text-zinc-600 text-sm">Memuat layanan...</p>
                ) : servicesList.length === 0 ? (
                  <p className="text-zinc-600 text-sm">Barber ini belum memiliki layanan yang ditetapkan.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {servicesList.map(service => (
                      <button key={service.id} onClick={() => toggleService(service)} className={serviceClass(service.id)}>
                        {service.name} (Rp {service.price.toLocaleString('id-ID')})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Actions */}
        <section className="px-6 pt-8 pb-0 mt-6 border-t border-zinc-800/50 flex justify-between items-center bg-[#0A0A0A] rounded-2xl mb-12">
          <button
            onClick={handleCancel}
            className="text-zinc-400 text-xs font-bold tracking-[0.1em] uppercase hover:text-white transition-colors"
          >
            CANCEL RITUAL
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={isSubmitting || hasActiveBooking}
            className="bg-[#E5C158] text-black px-12 py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shadow-lg shadow-[#E5C158]/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <LuLoader className="w-4 h-4 animate-spin" /> : "CONFIRM BOOKING"}
          </button>
        </section>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
          <div className="bg-[#141414] border-t sm:border border-zinc-800 rounded-t-[2.5rem] sm:rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-serif text-[#C5A059]">Pembayaran</h3>
                <div className="text-[#E5C158] font-mono font-bold px-2 py-0.5 bg-[#E5C158]/10 rounded border border-[#E5C158]/20 text-[10px]">
                  {countdown}
                </div>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Order Summary */}
              <div className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Jadwal</span>
                  <span className="text-white text-sm font-medium">
                    {selectedDate ? format(selectedDate, "dd MMM yyyy", { locale: id }) : ""} - {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Barber</span>
                  <span className="text-white text-sm font-medium">{selectedBarber?.name}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-zinc-500 text-xs mt-1">Layanan</span>
                  <div className="flex flex-col items-end gap-1">
                    {selectedServices.map(service => (
                      <span key={service.id} className="text-white text-sm font-medium">{service.name}</span>
                    ))}
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-[#C5A059] text-xs font-bold uppercase tracking-wider">Total Bayar</span>
                  <span className="text-[#C5A059] text-lg font-bold font-mono">
                    RP {calculateTotal().toLocaleString('id-ID')}
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
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 5 * 1024 * 1024) {
                        alert("Ukuran file terlalu besar! Maksimal 5MB. Silakan gunakan file yang lebih kecil.");
                        setUploadedFile(null);
                        setShowPaymentModal(false); // Menutup pop-up sesuai permintaan
                      } else {
                        setUploadedFile(file || null);
                      }
                    }}
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
            <div className="p-6 border-t border-zinc-800/50 bg-[#141414] shrink-0">
              <button
                onClick={handleSubmitPayment}
                disabled={!uploadedFile || isUploading}
                className="w-full bg-[#E5C158] disabled:opacity-50 disabled:cursor-not-allowed text-black py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shadow-lg shadow-[#E5C158]/10 flex justify-center items-center gap-2"
              >
                {isUploading ? <LuLoader className="w-5 h-5 animate-spin" /> : "KIRIM KE ADMIN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="bg-[#141414] border-t sm:border border-zinc-800 rounded-t-[2.5rem] sm:rounded-2xl w-full max-w-sm relative z-10 overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-end p-4">
              <button onClick={() => setShowLoginModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                <LuX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-8 pb-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center mb-6">
                <LuLogIn className="w-7 h-7 text-[#C5A059]" />
              </div>
              <h3 className="text-xl font-serif text-white mb-2">Login Diperlukan</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                Silakan login atau buat akun terlebih dahulu untuk mengonfirmasi booking Anda.
              </p>
              <div className="flex flex-col w-full gap-3">
                <Link
                  href="/login?redirect=/Rituals"
                  className="w-full bg-[#E5C158] text-black py-3.5 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors text-center"
                >
                  LOGIN
                </Link>
                <Link
                  href="/login?redirect=/Rituals&tab=register"
                  className="w-full bg-transparent text-[#C5A059] border border-[#C5A059]/30 py-3.5 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059]/10 transition-colors text-center"
                >
                  REGISTER
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
