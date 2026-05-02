"use client";

import { useState, useEffect } from "react";
import { LuUser, LuCalendar, LuLoader, LuUpload, LuX } from "react-icons/lu";
import { getBookingHistory, submitPaymentProof, cancelBooking } from "@/app/actions/booking";
import { format } from "date-fns";
import { id } from "date-fns/locale";

function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string, onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(expiresAt).getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft("EXPIRED");
        onExpire();
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return <span className="text-[#E5C158] font-mono text-xs font-bold ml-2">({timeLeft})</span>;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State for uploading proof from history
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  async function loadHistory() {
    setIsLoading(true);
    const res = await getBookingHistory(page, 5);
    setHistory(res.data || []);
    setTotalPages(res.totalPages || 1);
    setIsLoading(false);
  }

  useEffect(() => {
    loadHistory();
  }, [page]);

  const handleNext = () => {
    if (page < totalPages) setPage(p => p + 1);
  };

  const handlePrev = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const getStatusBadge = (booking: any) => {
    const isExpired = new Date(booking.expires_at) < new Date();
    
    if (booking.status === "cancelled" || (booking.status === "awaiting_payment" && isExpired)) {
      return { text: "EXPIRED", colorClass: "text-red-500", borderClass: "border-red-500/50" };
    }
    if (booking.status === "awaiting_payment") {
      return { text: "AWAITING PAYMENT", colorClass: "text-orange-500", borderClass: "border-orange-500/50" };
    }
    if (booking.status === "pending_confirmation") {
      return { text: "PENDING", colorClass: "text-yellow-500", borderClass: "border-yellow-500/50" };
    }
    if (booking.status === "confirmed" || booking.status === "completed") {
      return { text: "CONFIRMED", colorClass: "text-green-500", borderClass: "border-green-500/50" };
    }
    return { text: "UNKNOWN", colorClass: "text-zinc-500", borderClass: "border-zinc-800" };
  };

  const handleSubmitPayment = async () => {
    if (!uploadedFile || !selectedBookingId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);

    const res = await submitPaymentProof(selectedBookingId, formData);
    setIsUploading(false);

    if (res.success) {
      alert("Bukti pembayaran berhasil diupload!");
      setSelectedBookingId(null);
      setUploadedFile(null);
      loadHistory();
    } else {
      alert("Gagal mengupload bukti pembayaran: " + res.error);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;

    setIsCancelling(bookingId);
    const res = await cancelBooking(bookingId);
    setIsCancelling(null);

    if (res.success) {
      alert("Pesanan berhasil dibatalkan.");
      loadHistory();
    } else {
      alert("Gagal membatalkan pesanan: " + res.error);
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-white font-sans min-h-screen">
      <div className="max-w-6xl mx-auto md:px-6">
        {/* 1. Header Section */}
        <section className="px-6 md:px-0 pt-10 pb-12 md:pt-20 md:pb-12">
          <span className="text-[#C5A059] text-[10px] font-bold tracking-[0.2em] uppercase block mb-3">
            YOUR JOURNEY
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6">Booking<br />History</h1>
          <div className="w-16 h-1 bg-[#C5A059]"></div>
        </section>

        {/* 2. History List */}
        <section className="px-6 md:px-0 pb-24">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LuLoader className="w-8 h-8 text-[#C5A059] animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 bg-[#141414] rounded-2xl border border-zinc-900">
              <p className="text-zinc-500">Belum ada riwayat transaksi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((booking: any) => {
                const badge = getStatusBadge(booking);
                const isExpired = new Date(booking.expires_at) < new Date();
                const canUpload = booking.status === "awaiting_payment" && !isExpired;
                const servicesText = booking.items?.map((i: any) => i.service?.name).join(", ");

                return (
                  <div key={booking.id} className={`bg-[#141414] rounded-2xl p-6 border shadow-xl transition-all duration-300 hover:bg-zinc-900/50 hover:scale-[1.02] ${canUpload ? 'border-[#C5A059]/30' : 'border-zinc-900'}`}>
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-serif text-white line-clamp-1" title={servicesText}>
                        {servicesText}
                      </h3>
                      <span className="text-[#C5A059] font-bold text-lg whitespace-nowrap ml-4">
                        RP {booking.total_price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Barber Info */}
                    <div className="flex items-center gap-2 text-zinc-500 text-sm mb-6">
                      <LuUser size={14} className="text-[#C5A059]" />
                      <span>Barber: {booking.barber?.name}</span>
                    </div>

                    {/* Separator */}
                    <div className="h-[1px] bg-zinc-800/50 mb-6"></div>

                    {/* Card Footer */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <LuCalendar size={14} className="text-zinc-500" />
                        <span>{format(new Date(booking.booking_date), "MMM dd, yyyy")}</span>
                      </div>
                      <div className={`px-4 py-1.5 bg-zinc-900/50 border rounded-md flex items-center gap-2 ${badge.borderClass}`}>
                        <span className={`text-[10px] font-bold tracking-widest ${badge.colorClass}`}>
                          {badge.text}
                        </span>
                        {booking.status === "awaiting_payment" && !isExpired && (
                          <CountdownTimer expiresAt={booking.expires_at} onExpire={() => loadHistory()} />
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                      <p className="text-[#C5A059] font-bold font-mono text-lg">
                        RP {booking.total_price.toLocaleString('id-ID')}
                      </p>
                      
                      <div className="flex gap-3 w-full md:w-auto">
                        {canUpload && (
                          <button
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="flex-1 md:flex-none bg-[#E5C158]/10 text-[#E5C158] border border-[#E5C158]/30 px-4 py-2 rounded-lg text-xs font-bold tracking-wider hover:bg-[#E5C158] hover:text-black transition-colors"
                          >
                            UPLOAD BUKTI
                          </button>
                        )}
                        
                        {((booking.status === "awaiting_payment" && !isExpired) || booking.status === "pending_confirmation") && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={isCancelling === booking.id}
                            className="flex-1 md:flex-none border border-red-500/30 text-red-500/70 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all disabled:opacity-50"
                          >
                            {isCancelling === booking.id ? "BATALKAN..." : "BATALKAN"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && !isLoading && (
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className="text-zinc-400 text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 px-4 py-2 rounded-lg hover:border-zinc-600 transition-colors"
              >
                Previous
              </button>
              <span className="text-zinc-500 text-sm">Halaman {page} dari {totalPages}</span>
              <button
                onClick={handleNext}
                disabled={page === totalPages}
                className="text-zinc-400 text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 px-4 py-2 rounded-lg hover:border-zinc-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Upload Modal (If triggered from History) */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedBookingId(null)}></div>
          <div className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800/50 pb-4">
              <h3 className="text-xl font-serif text-[#C5A059]">Upload Bukti</h3>
              <button onClick={() => setSelectedBookingId(null)} className="text-zinc-500 hover:text-white transition-colors"><LuX size={24} /></button>
            </div>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-[#1A1A1A] hover:bg-zinc-900 transition-colors mb-6">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                <LuUpload className="w-8 h-8 mb-3 text-zinc-500" />
                <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-[#C5A059]">Klik untuk upload</span> atau drag and drop</p>
                <p className="text-xs text-zinc-600">SVG, PNG, JPG (MAX. 5MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} />
            </label>
            
            {uploadedFile && <p className="mb-6 text-xs text-green-500 text-center font-medium truncate px-4">{uploadedFile.name}</p>}

            <button
              onClick={handleSubmitPayment}
              disabled={!uploadedFile || isUploading}
              className="w-full bg-[#E5C158] disabled:opacity-50 disabled:cursor-not-allowed text-black py-4 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shadow-lg shadow-[#E5C158]/10 flex justify-center items-center gap-2"
            >
              {isUploading ? <LuLoader className="w-5 h-5 animate-spin" /> : "KIRIM BUKTI"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
