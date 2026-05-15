"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { LuLoader, LuLogOut, LuScissors, LuUsers, LuCalendarOff, LuClipboardList, LuPlus, LuTrash2, LuPencil, LuX, LuCheck, LuImage, LuEye, LuCalendar, LuClock } from "react-icons/lu";
import {
  getAllBarbers, createBarber, updateBarber, deleteBarber,
  getAllServices, createService, updateService, deleteService,
  getAllBookings, updateBookingStatus,
  getShopSettings, addClosedDate, deleteClosedDate,
  getBarberSchedule, blockBarberSlot, unblockBarberSlot,
  getBarberAbsences, toggleBarberAbsence, rescheduleBooking,
  getBarberServices, toggleBarberService, getAllBarberServices
} from "@/app/actions/admin";
import { checkAvailability } from "@/app/actions/booking";
import { format, addDays, startOfToday, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isBefore, isAfter, isSameDay, isSameMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type Tab = "bookings" | "barbers" | "services" | "settings";

// ─── REUSABLE MODAL ─────────────────────────────────────────
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8">
      <div className="bg-[#1A1A1A] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-white font-serif text-lg">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><LuX size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── INPUT COMPONENT ────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 transition-all" />
    </div>
  );
}

// ─── BARBERS TAB ────────────────────────────────────────────
function BarbersTab() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", specialty: "", image_url: "" });

  // Accordion state (Calendar + Hourly combined)
  const [expandedBarberId, setExpandedBarberId] = useState<string | null>(null);
  const [absences, setAbsences] = useState<Record<string, string[]>>({});
  const [absenceLoading, setAbsenceLoading] = useState<Record<string, boolean>>({});
  const [calMonth, setCalMonth] = useState<Date>(startOfToday());
  const [selectedCalDate, setSelectedCalDate] = useState<string>(format(startOfToday(), "yyyy-MM-dd"));
  const [scheduleData, setScheduleData] = useState<{ bookings: any[]; blockedSlots: any[] }>({ bookings: [], blockedSlots: [] });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [blockReason, setBlockReason] = useState("Walk-in");

  const today = startOfToday();
  const calStart = startOfMonth(calMonth);
  const calEnd = endOfMonth(calMonth);
  const maxDate = endOfMonth(addMonths(today, 1));

  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const startPad = getDay(calStart); // 0=Sun

  const TIME_SLOTS = [
    "09:00", "10:00", "11:00",
    "12:30", "13:30", "14:30", "15:30", "16:30",
    "18:00", "19:00"
  ];

  const load = async () => { setLoading(true); setBarbers(await getAllBarbers()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", specialty: "", image_url: "" }); setModal(true); };
  const openEdit = (b: any) => { setEditing(b); setForm({ name: b.name, specialty: b.specialty, image_url: b.image_url || "" }); setModal(true); };

  const handleSave = async () => {
    if (editing) await updateBarber(editing.id, { ...form, is_active: editing.is_active });
    else await createBarber(form);
    setModal(false); load();
  };

  const handleToggle = async (b: any) => { await updateBarber(b.id, { name: b.name, specialty: b.specialty, image_url: b.image_url, is_active: !b.is_active }); load(); };
  const handleDelete = async (id: string) => { if (confirm("Hapus barber ini?")) { await deleteBarber(id); load(); } };

  // Expand barber row: load absences and today's schedule
  const handleExpand = async (barberId: string) => {
    if (expandedBarberId === barberId) { setExpandedBarberId(null); return; }
    setExpandedBarberId(barberId);
    setCalMonth(today);
    const dateStr = format(today, "yyyy-MM-dd");
    setSelectedCalDate(dateStr);
    setAbsenceLoading(prev => ({ ...prev, [barberId]: true }));
    const [absData, schData] = await Promise.all([
      getBarberAbsences(barberId, format(today, "yyyy-MM-dd"), format(maxDate, "yyyy-MM-dd")),
      getBarberSchedule(barberId, dateStr),
    ]);
    setAbsences(prev => ({ ...prev, [barberId]: absData }));
    setScheduleData(schData);
    setAbsenceLoading(prev => ({ ...prev, [barberId]: false }));
  };

  const handleSelectDate = async (barberId: string, dateStr: string) => {
    setSelectedCalDate(dateStr);
    setScheduleLoading(true);
    const data = await getBarberSchedule(barberId, dateStr);
    setScheduleData(data);
    setScheduleLoading(false);
  };

  const handleToggleAbsence = async (barberId: string, date: string, currentAbsent: boolean) => {
    setAbsences(prev => {
      const cur = prev[barberId] || [];
      return { ...prev, [barberId]: currentAbsent ? cur.filter(d => d !== date) : [...cur, date] };
    });
    await toggleBarberAbsence(barberId, date, !currentAbsent);
    // reload schedule panel for selected date
    if (date === selectedCalDate) {
      const data = await getBarberSchedule(barberId, date);
      setScheduleData(data);
    }
  };

  const handleBlockSlot = async (barberId: string, time: string) => {
    await blockBarberSlot(barberId, selectedCalDate, time, blockReason);
    const data = await getBarberSchedule(barberId, selectedCalDate);
    setScheduleData(data);
  };

  const handleUnblockSlot = async (barberId: string, slotId: string) => {
    await unblockBarberSlot(slotId);
    const data = await getBarberSchedule(barberId, selectedCalDate);
    setScheduleData(data);
  };

  const getSlotStatus = (time: string) => {
    const booking = scheduleData.bookings.find(b => b.booking_time === time);
    if (booking) return { type: "booked" as const, data: booking };
    const blocked = scheduleData.blockedSlots.find(s => s.time === time);
    if (blocked) return { type: "blocked" as const, data: blocked };
    return { type: "free" as const, data: null };
  };

  const isTimePassed = (timeStr: string) => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    
    if (selectedCalDate < todayStr) return true;
    if (selectedCalDate > todayStr) return false;
    
    const timeMatch = timeStr.match(/(\d+):(\d+)/);
    if (!timeMatch) return false;
    
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    
    const selectedTimeMins = hours * 60 + minutes;
    const currentTimeMins = now.getHours() * 60 + now.getMinutes();
    
    return selectedTimeMins <= currentTimeMins;
  };

  const canGoNextMonth = isBefore(startOfMonth(addMonths(calMonth, 1)), startOfMonth(addMonths(today, 2)));


  if (loading) return <div className="flex justify-center py-20"><LuLoader className="w-8 h-8 text-[#C5A059] animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif text-white">Barbers</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#E5C158] text-black px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-[#C5A059] transition-colors">
          <LuPlus size={16} /> TAMBAH
        </button>
      </div>
      <div className="space-y-4">
        {barbers.map(b => (
          <div key={b.id} className="flex flex-col gap-2">
            <div 
              onClick={() => handleExpand(b.id)}
              className={`bg-[#141414] border border-zinc-900 rounded-xl p-4 flex items-center gap-4 transition-all cursor-pointer hover:border-zinc-800 ${!b.is_active ? "opacity-50" : ""} ${expandedBarberId === b.id ? "border-[#C5A059]/30 ring-1 ring-[#C5A059]/10 bg-[#1A1A1A]" : ""}`}
            >
              <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                {b.image_url && <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{b.name}</p>
                <p className="text-zinc-500 text-xs">{b.specialty}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); handleToggle(b); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider border transition-colors ${b.is_active ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-red-500/30 text-red-400 hover:bg-red-500/10"}`}>
                  {b.is_active ? "AKTIF" : "NONAKTIF"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); openEdit(b); }} className="p-2 text-zinc-500 hover:text-[#C5A059] transition-colors"><LuPencil size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }} className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><LuTrash2 size={16} /></button>
              </div>
            </div>

            {/* Accordion: 2-column layout - Calendar Left, Slot Manager Right */}
            {expandedBarberId === b.id && (
              <div className="bg-[#141414] border border-zinc-800/60 rounded-xl overflow-hidden">
                {absenceLoading[b.id] ? (
                  <div className="flex justify-center py-12"><LuLoader className="w-5 h-5 text-[#C5A059] animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-[320px_1fr]">
                    {/* LEFT: Compact Calendar */}
                    <div className="p-5 border-r border-zinc-800/60">
                      <p className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">Kelola Cuti</p>
                      {/* Month Nav */}
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={() => !isSameMonth(calMonth, today) && setCalMonth(addMonths(calMonth, -1))}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors ${isSameMonth(calMonth, today) ? 'opacity-20 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}>‹</button>
                        <span className="text-white text-xs font-serif">{format(calMonth, "MMMM yyyy", { locale: idLocale })}</span>
                        <button onClick={() => canGoNextMonth && setCalMonth(addMonths(calMonth, 1))}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-colors ${!canGoNextMonth ? 'opacity-20 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}>›</button>
                      </div>
                      {/* Weekday Headers */}
                      <div className="grid grid-cols-7 mb-1">
                        {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
                          <div key={d} className="text-center text-[9px] font-bold text-[#C5A059] py-1">{d}</div>
                        ))}
                      </div>
                      {/* Day Grid */}
                      <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: getDay(calStart) }).map((_, i) => <div key={`p${i}`} />)}
                        {calendarDays.map(day => {
                          const ds = format(day, "yyyy-MM-dd");
                          const isPast = isBefore(day, today);
                          const isAbsent = (absences[b.id] || []).includes(ds);
                          const isSelected = ds === selectedCalDate;
                          const isFuture = isAfter(day, maxDate);
                          const disabled = isPast || isFuture;
                          return (
                            <button key={ds} disabled={disabled}
                              onClick={() => { if (!disabled) handleSelectDate(b.id, ds); }}
                              className={`relative w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-[11px] transition-all
                                ${disabled ? 'text-zinc-700 cursor-not-allowed' : isAbsent ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 cursor-pointer' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700 cursor-pointer'}
                                ${isSelected && !disabled ? 'ring-2 ring-[#C5A059]' : ''}
                                ${isSameDay(day, today) ? 'ring-1 ring-[#C5A059]/40' : ''}
                              `}>
                              {format(day, "d")}
                            </button>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-zinc-800/50">
                        <span className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>Cuti</span>
                        <span className="flex items-center gap-1 text-[9px] text-zinc-500"><span className="w-2 h-2 rounded-full bg-zinc-700 inline-block"/>Lewat</span>
                        <span className="flex items-center gap-1 text-[9px] text-zinc-500 border-2 border-[#C5A059] rounded-sm px-1">Dipilih</span>
                      </div>
                    </div>

                    {/* RIGHT: Slot Manager for selected date */}
                    <div className="p-5 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Blokir Jam</p>
                          <p className="text-white text-sm font-bold mt-0.5">
                            {format(new Date(selectedCalDate + 'T00:00:00'), "EEEE, dd MMM yyyy", { locale: idLocale })}
                          </p>
                        </div>
                        {/* Toggle Cuti Hari Ini */}
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400 text-[10px] font-bold tracking-wider">NONAKTIF HARI INI</span>
                          <button
                            onClick={() => { const isAbs = (absences[b.id] || []).includes(selectedCalDate); handleToggleAbsence(b.id, selectedCalDate, isAbs); }}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${(absences[b.id] || []).includes(selectedCalDate) ? 'bg-red-500' : 'bg-zinc-700'}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${(absences[b.id] || []).includes(selectedCalDate) ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Block reason input */}
                      <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                        placeholder="Alasan blokir jam..."
                        className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 transition-all mb-4" />

                      {/* Time Slots */}
                      {scheduleLoading ? (
                        <div className="flex justify-center py-6"><LuLoader className="w-5 h-5 text-[#C5A059] animate-spin" /></div>
                      ) : (absences[b.id] || []).includes(selectedCalDate) ? (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-red-400 text-xs font-bold tracking-widest">BARBER CUTI — SEMUA JAM DIBLOKIR</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5 overflow-y-auto">
                          {TIME_SLOTS.map(time => {
                            const status = getSlotStatus(time);
                            const passed = isTimePassed(time);
                            
                            return (
                              <div key={time} className={`rounded-lg p-2.5 border text-center transition-all 
                                ${passed ? "bg-zinc-900/50 border-zinc-800/50 opacity-50 cursor-not-allowed" : 
                                  status.type === "booked" ? "bg-blue-500/5 border-blue-500/20" : 
                                  status.type === "blocked" ? "bg-red-500/5 border-red-500/20" : 
                                  "bg-[#0A0A0A] border-zinc-800 hover:border-zinc-600"}`}>
                                <p className={`text-xs font-mono font-bold mb-1.5 
                                  ${passed ? "text-zinc-500" : 
                                    status.type === "booked" ? "text-blue-300" : 
                                    status.type === "blocked" ? "text-red-400" : "text-white"}`}>
                                  {time}
                                </p>
                                
                                {passed ? (
                                  <p className="text-[9px] text-zinc-600 tracking-wider font-bold">LEWAT</p>
                                ) : (
                                  <>
                                    {status.type === "booked" && <p className="text-[9px] text-blue-400 truncate">{status.data?.user?.full_name || "Booked"}</p>}
                                    {status.type === "blocked" && (
                                      <button onClick={() => handleUnblockSlot(b.id, status.data.id)} className="text-[9px] text-green-500 hover:text-green-400 font-bold tracking-wider">BUKA</button>
                                    )}
                                    {status.type === "free" && (
                                      <button onClick={() => handleBlockSlot(b.id, time)} className="text-[9px] text-zinc-500 hover:text-red-400 font-bold tracking-wider w-full">BLOKIR</button>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Barber Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Barber" : "Tambah Barber"}>
        <div className="space-y-4">
          <Field label="Nama" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Nama barber" />
          <Field label="Spesialisasi" value={form.specialty} onChange={v => setForm(p => ({ ...p, specialty: v }))} placeholder="e.g. Senior Grooming Specialist" />
          <Field label="URL Foto" value={form.image_url} onChange={v => setForm(p => ({ ...p, image_url: v }))} placeholder="https://..." />
          <button onClick={handleSave} className="w-full bg-[#E5C158] text-black py-3 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors mt-2">SIMPAN</button>
        </div>
      </Modal>
    </div>
  );
}


// ─── SERVICES TAB ───────────────────────────────────────────
function ServicesTab() {
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", description: "" });

  // Accordion: which service is expanded
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  // Map: serviceId -> barber assignment loading state
  const [assignmentLoading, setAssignmentLoading] = useState<Record<string, boolean>>({});
  // Map: serviceId -> array of assigned barber_ids
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  const load = async () => {
    setLoading(true);
    const [svcs, brbs, allAssignments] = await Promise.all([
      getAllServices(), 
      getAllBarbers(),
      getAllBarberServices()
    ]);
    
    setServices(svcs);
    setBarbers(brbs);

    // Grouping assignments by service_id
    const grouped: Record<string, string[]> = {};
    // Inisialisasi semua service dengan array kosong agar badge muncul (0 barber)
    svcs.forEach(s => grouped[s.id] = []);
    // Isi dengan data dari database
    allAssignments.forEach(item => {
      if (grouped[item.service_id]) {
        grouped[item.service_id].push(item.barber_id);
      }
    });
    setAssignments(grouped);

    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", price: "", description: "" }); setModal(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ name: s.name, price: String(s.price), description: s.description || "" }); setModal(true); };

  const handleSave = async () => {
    const payload = { name: form.name, price: Number(form.price), description: form.description };
    if (editing) await updateService(editing.id, payload);
    else await createService(payload);
    setModal(false); load();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus service ini?")) {
      await deleteService(id);
      if (expandedServiceId === id) setExpandedServiceId(null);
      load();
    }
  };

  // Expand accordion: assignment data is now pre-loaded in 'load'
  const handleExpand = async (serviceId: string) => {
    if (expandedServiceId === serviceId) { setExpandedServiceId(null); return; }
    setExpandedServiceId(serviceId);
  };

  // Toggle barber assignment for a service
  const handleToggleBarber = async (serviceId: string, barberId: string) => {
    const current = assignments[serviceId] || [];
    const isAssigned = current.includes(barberId);

    // Optimistic update
    setAssignments(prev => ({
      ...prev,
      [serviceId]: isAssigned ? current.filter(id => id !== barberId) : [...current, barberId]
    }));

    // toggleBarberService(barberId, serviceId, isCurrentlyAssigned)
    await toggleBarberService(barberId, serviceId, isAssigned);
  };

  if (loading) return <div className="flex justify-center py-20"><LuLoader className="w-8 h-8 text-[#C5A059] animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-serif text-white">Services</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#E5C158] text-black px-4 py-2.5 rounded-lg text-xs font-bold tracking-wider hover:bg-[#C5A059] transition-colors">
          <LuPlus size={16} /> TAMBAH
        </button>
      </div>
      <p className="text-zinc-600 text-[11px] mb-6">Klik service untuk mengatur barber mana yang bisa melakukan layanan tersebut.</p>

      <div className="space-y-3">
        {services.map(s => (
          <div key={s.id} className="flex flex-col gap-0">
            {/* Service Card */}
            <div
              onClick={() => handleExpand(s.id)}
              className={`bg-[#141414] border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-zinc-700
                ${expandedServiceId === s.id
                  ? "border-[#C5A059]/40 ring-1 ring-[#C5A059]/10 rounded-b-none"
                  : "border-zinc-900"}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{s.name}</p>
                  {/* Show count of assigned barbers */}
                  {assignments[s.id] !== undefined && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider
                      ${assignments[s.id].length > 0 ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-zinc-800 text-zinc-500"}`}>
                      {assignments[s.id].length} BARBER
                    </span>
                  )}
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">{s.description || "Tidak ada deskripsi"}</p>
              </div>
              <p className="text-[#E5C158] font-bold text-sm shrink-0">Rp {s.price.toLocaleString("id-ID")}</p>
              <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(s)} className="p-2 text-zinc-500 hover:text-[#C5A059] transition-colors"><LuPencil size={16} /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><LuTrash2 size={16} /></button>
              </div>
              <span className={`text-zinc-600 transition-transform duration-200 ${expandedServiceId === s.id ? 'rotate-90' : ''}`}>›</span>
            </div>

            {/* Accordion: Barber Assignment */}
            {expandedServiceId === s.id && (
              <div className="bg-[#0F0F0F] border border-t-0 border-[#C5A059]/40 rounded-b-xl px-5 py-4">
                <p className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-3">Barber yang Bisa Melakukan Layanan Ini</p>
                {assignmentLoading[s.id] ? (
                  <div className="flex justify-center py-4">
                    <LuLoader className="w-5 h-5 text-[#C5A059] animate-spin" />
                  </div>
                ) : barbers.length === 0 ? (
                  <p className="text-zinc-600 text-xs">Belum ada barber terdaftar.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {barbers.map(b => {
                      const isAssigned = (assignments[s.id] || []).includes(b.id);
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleToggleBarber(s.id, b.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-wide border transition-all duration-200
                            ${isAssigned
                              ? "bg-[#C5A059]/20 border-[#C5A059]/60 text-[#E5C158] shadow-sm shadow-[#C5A059]/10"
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"}`}
                        >
                          {/* Mini avatar */}
                          <div className={`w-5 h-5 rounded-full overflow-hidden bg-zinc-700 shrink-0 ring-1
                            ${isAssigned ? "ring-[#C5A059]/60" : "ring-zinc-700"}`}>
                            {b.image_url && <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />}
                          </div>
                          {b.name}
                          {isAssigned && <LuCheck size={12} className="text-[#E5C158]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Service" : "Tambah Service"}>
        <div className="space-y-4">
          <Field label="Nama Layanan" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Haircut" />
          <Field label="Harga (Rp)" value={form.price} onChange={v => setForm(p => ({ ...p, price: v }))} type="number" placeholder="50000" />
          <Field label="Deskripsi" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Deskripsi singkat layanan" />
          <button onClick={handleSave} className="w-full bg-[#E5C158] text-black py-3 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors mt-2">SIMPAN</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── BOOKINGS TAB ───────────────────────────────────────────
function BookingsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  // Reschedule State
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rescheduleForm, setRescheduleForm] = useState({ barberId: "", date: "", time: "" });
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => { setLoading(true); const res = await getAllBookings(page, 8); setBookings(res.data || []); setTotalPages(res.totalPages || 1); setLoading(false); };
  useEffect(() => { 
    load(); 
    getAllBarbers().then(setBarbers);
  }, [page]);

  const fetchSlots = async (date: string, barberId: string) => {
    if (!date || !barberId) return;
    setLoadingSlots(true);
    try {
      const bookedOrBlocked = await checkAvailability(date, barberId);
      
      const TIME_SLOTS = [
        "09:00", "10:00", "11:00",
        "12:30", "13:30", "14:30", "15:30", "16:30",
        "18:00", "19:00"
      ];

      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");

      const available = TIME_SLOTS.filter(slot => {
        if (bookedOrBlocked.includes(slot)) return false;
        
        // Filter past times if today
        if (date === todayStr) {
          const timeMatch = slot.match(/(\d+):(\d+)/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            
            const selectedTimeMins = hours * 60 + minutes;
            const currentTimeMins = now.getHours() * 60 + now.getMinutes();
            
            if (selectedTimeMins <= currentTimeMins) return false;
          }
        }
        return true;
      });
      
      setAvailableTimes(available);
    } catch (err) {
      console.error(err);
    }
    setLoadingSlots(false);
  };

  useEffect(() => {
    if (rescheduleModal && rescheduleForm.date && rescheduleForm.barberId) {
      fetchSlots(rescheduleForm.date, rescheduleForm.barberId);
    } else {
      setAvailableTimes([]);
    }
  }, [rescheduleForm.date, rescheduleForm.barberId, rescheduleModal]);

  const handleRescheduleClick = (booking: any) => {
    setSelectedBooking(booking);
    setRescheduleForm({
      barberId: booking.barber_id || "",
      date: booking.booking_date || "",
      time: booking.booking_time || ""
    });
    setRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleForm.barberId || !rescheduleForm.date || !rescheduleForm.time) {
      alert("Harap lengkapi semua field reschedule.");
      return;
    }
    setIsSubmitting(true);
    const res = await rescheduleBooking(selectedBooking.id, rescheduleForm.barberId, rescheduleForm.date, rescheduleForm.time);
    setIsSubmitting(false);
    
    if (res.success) {
      setRescheduleModal(false);
      load();
    } else {
      alert("Gagal reschedule: " + res.error);
    }
  };

  const statusColor: Record<string, string> = {
    awaiting_payment: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
    pending_confirmation: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    confirmed: "text-green-400 border-green-500/30 bg-green-500/5",
    completed: "text-emerald-300 border-emerald-500/30 bg-emerald-500/5",
    cancelled: "text-red-400 border-red-500/30 bg-red-500/5",
  };

  const handleStatus = async (id: string, status: string) => { await updateBookingStatus(id, status); load(); };

  if (loading) return <div className="flex justify-center py-20"><LuLoader className="w-8 h-8 text-[#C5A059] animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-serif text-white mb-6">Bookings</h2>
      {bookings.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">Belum ada booking.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-[#141414] border border-zinc-900 rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-white text-sm font-medium">{b.user?.full_name || b.user?.email || "Unknown"}</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">{b.user?.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${statusColor[b.status] || "text-zinc-400 border-zinc-700"}`}>
                  {b.status.toUpperCase().replace("_", " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                <div><span className="text-zinc-600">Barber</span><p className="text-zinc-300 mt-0.5">{b.barber?.name}</p></div>
                <div><span className="text-zinc-600">Tanggal</span><p className="text-zinc-300 mt-0.5">{b.booking_date}</p></div>
                <div><span className="text-zinc-600">Jam</span><p className="text-zinc-300 mt-0.5">{b.booking_time}</p></div>
                <div><span className="text-zinc-600">Total</span><p className="text-[#E5C158] mt-0.5 font-bold">Rp {b.total_price?.toLocaleString("id-ID")}</p></div>
              </div>
              <div className="text-xs text-zinc-500 mb-3">
                Layanan: {b.items?.map((i: any) => i.service?.name).join(", ") || "-"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {b.payment_proof_url && (
                  <button onClick={() => setProofUrl(b.payment_proof_url)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors">
                    <LuEye size={14} /> BUKTI BAYAR
                  </button>
                )}
                {b.status === "pending_confirmation" && (
                  <>
                    <button onClick={() => handleStatus(b.id, "confirmed")} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/10 transition-colors">
                      <LuCheck size={14} /> KONFIRMASI
                    </button>
                    <button onClick={() => handleStatus(b.id, "cancelled")} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                      <LuX size={14} /> TOLAK
                    </button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <>
                    <button onClick={() => handleStatus(b.id, "completed")} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-colors">
                      <LuCheck size={14} /> SELESAI
                    </button>
                    <button onClick={() => handleRescheduleClick(b)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/10 transition-colors">
                      <LuCalendar size={14} /> RESCHEDULE
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:border-zinc-600 disabled:opacity-30 transition-colors">PREV</button>
          <span className="text-zinc-500 text-xs">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:border-zinc-600 disabled:opacity-30 transition-colors">NEXT</button>
        </div>
      )}
      {/* Proof Modal */}
      <Modal open={!!proofUrl} onClose={() => setProofUrl(null)} title="Bukti Pembayaran">
        {proofUrl && (
          <div className="flex justify-center bg-black/20 rounded-lg p-2">
            <img src={proofUrl} alt="Bukti Pembayaran" className="max-w-full max-h-[60vh] rounded-lg object-contain" />
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal open={rescheduleModal} onClose={() => setRescheduleModal(false)} title="Reschedule Booking">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Pilih Barber</label>
            <select
              value={rescheduleForm.barberId}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, barberId: e.target.value, time: "" }))}
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-all appearance-none"
            >
              <option value="">-- Pilih Barber --</option>
              {barbers.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Tanggal Baru</label>
            <input
              type="date"
              value={rescheduleForm.date}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 14), "yyyy-MM-dd")}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value, time: "" }))}
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-all [color-scheme:dark]"
            />
            <p className="text-xs text-zinc-600 mt-1">Maksimal 14 hari ke depan.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Jam Baru</label>
            <select
              value={rescheduleForm.time}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
              disabled={!rescheduleForm.date || !rescheduleForm.barberId || loadingSlots}
              className="w-full bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-all appearance-none disabled:opacity-50"
            >
              <option value="">{loadingSlots ? "Memuat jadwal..." : "-- Pilih Jam --"}</option>
              {availableTimes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {rescheduleForm.date && rescheduleForm.barberId && availableTimes.length === 0 && !loadingSlots && (
              <p className="text-xs text-red-400 mt-1">Tidak ada jam tersedia di tanggal ini.</p>
            )}
          </div>

          <button
            onClick={submitReschedule}
            disabled={isSubmitting || !rescheduleForm.barberId || !rescheduleForm.date || !rescheduleForm.time}
            className="w-full bg-[#E5C158] text-black py-3 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
          >
            {isSubmitting ? <LuLoader className="w-4 h-4 animate-spin" /> : "SIMPAN RESCHEDULE"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── SETTINGS TAB ───────────────────────────────────────────
function SettingsTab() {
  const [dates, setDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ closed_date: "", reason: "" });

  const load = async () => { setLoading(true); setDates(await getShopSettings()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.closed_date) return;
    await addClosedDate(form);
    setForm({ closed_date: "", reason: "" }); load();
  };

  const handleDelete = async (id: string) => { await deleteClosedDate(id); load(); };

  if (loading) return <div className="flex justify-center py-20"><LuLoader className="w-8 h-8 text-[#C5A059] animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-serif text-white mb-6">Hari Libur</h2>
      <div className="bg-[#141414] border border-zinc-900 rounded-xl p-5 mb-6">
        <p className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">TAMBAH TANGGAL LIBUR</p>
        <div className="flex flex-col md:flex-row gap-3">
          <input type="date" value={form.closed_date} onChange={e => setForm(p => ({ ...p, closed_date: e.target.value }))}
            onClick={(e) => { if ('showPicker' in e.currentTarget) { try { e.currentTarget.showPicker(); } catch(err) {} } }}
            style={{ colorScheme: 'dark' }}
            className="flex-1 bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C5A059]/50 transition-all cursor-pointer" />
          <input type="text" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Alasan (opsional)"
            className="flex-1 bg-[#0A0A0A] border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#C5A059]/50 transition-all" />
          <button onClick={handleAdd} className="bg-[#E5C158] text-black px-6 py-3 rounded-lg text-xs font-bold tracking-widest hover:bg-[#C5A059] transition-colors shrink-0">TAMBAH</button>
        </div>
      </div>
      <div className="space-y-2">
        {dates.length === 0 ? (
          <p className="text-center text-zinc-500 py-10">Belum ada tanggal libur yang diatur.</p>
        ) : dates.map(d => (
          <div key={d.id} className="bg-[#141414] border border-zinc-900 rounded-xl px-5 py-3.5 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{d.closed_date}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{d.reason || "Tidak ada alasan"}</p>
            </div>
            <button onClick={() => handleDelete(d.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors"><LuTrash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("bookings");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== "admin") { router.replace("/Journal"); return; }
      setIsAuthorized(true);
      setIsLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (isLoading || !isAuthorized) {
    return <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center"><LuLoader className="w-8 h-8 text-[#C5A059] animate-spin" /></div>;
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "bookings", label: "Bookings", icon: LuClipboardList },
    { key: "barbers", label: "Barbers", icon: LuUsers },
    { key: "services", label: "Services", icon: LuScissors },
    { key: "settings", label: "Hari Libur", icon: LuCalendarOff },
  ];

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-zinc-800/50 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">HERITAGE</span>
              <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">ATELIER</span>
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded">ADMIN</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-zinc-500 hover:text-red-400 transition-colors text-xs font-bold tracking-wider">
            <LuLogOut size={16} /> LOGOUT
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider whitespace-nowrap transition-all duration-300 border ${
                  tab === t.key
                    ? "bg-[#E5C158]/10 border-[#C5A059]/30 text-[#E5C158]"
                    : "border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                }`}>
                <Icon size={16} /> {t.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {tab === "bookings" && <BookingsTab />}
        {tab === "barbers" && <BarbersTab />}
        {tab === "services" && <ServicesTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </div>
  );
}
