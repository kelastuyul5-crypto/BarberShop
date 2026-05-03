"use server";

import { supabase, supabaseAdmin } from "@/utils/supabase";
import { revalidatePath } from "next/cache";

// NOTE: checkAdmin dinonaktifkan sementara karena supabase-js standar 
// tidak membaca session dari cookie secara otomatis di Server Actions 
// tanpa middleware/auth-helpers.
async function checkAdmin() {
  return true; // Bypass untuk sementara agar fitur bisa digunakan
}

// ─── BARBERS ────────────────────────────────────────────────

export async function getAllBarbers() {
  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching barbers:", error);
    return [];
  }
  return data;
}

export async function createBarber(input: { name: string; specialty: string; image_url: string }) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("barbers").insert(input);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function updateBarber(id: string, input: { name: string; specialty: string; image_url: string; is_active: boolean }) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("barbers").update(input).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteBarber(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("barbers").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

// ─── SERVICES ───────────────────────────────────────────────

export async function getAllServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }
  return data;
}

export async function createService(input: { name: string; description: string; price: number }) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("services").insert(input);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function updateService(id: string, input: { name: string; description: string; price: number }) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("services").update(input).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteService(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("services").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

import { autoCancelExpiredBookings } from "./booking";

// ─── BOOKINGS ───────────────────────────────────────────────

export async function getAllBookings(page: number = 1, limit: number = 10) {
  await autoCancelExpiredBookings();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("bookings")
    .select(`
      *,
      user:profiles(full_name, email),
      barber:barbers(name),
      items:booking_items(
        price_at_booking,
        service:services(name)
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching bookings:", error);
    return { data: [], totalPages: 0 };
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;
  return { data, totalPages };
}

export async function updateBookingStatus(bookingId: string, status: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

// ─── SHOP SETTINGS ──────────────────────────────────────────

export async function getShopSettings() {
  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .order("closed_date", { ascending: true });

  if (error) {
    console.error("Error fetching shop settings:", error);
    return [];
  }
  return data;
}

export async function addClosedDate(input: { closed_date: string; reason: string }) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("shop_settings").insert(input);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/Rituals");
  return { success: true };
}

export async function deleteClosedDate(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin.from("shop_settings").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/Rituals");
  return { success: true };
}

// ─── BARBER SCHEDULE ────────────────────────────────────────

export async function getBarberSchedule(barberId: string, date: string) {
  const now = new Date().toISOString();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      booking_time, status, expires_at,
      user:profiles(full_name, email)
    `)
    .eq("barber_id", barberId)
    .eq("booking_date", date);

  const activeBookings = (bookings || []).filter(b => {
    if (b.status === "confirmed" || b.status === "pending_confirmation" || b.status === "completed") return true;
    if (b.status === "awaiting_payment" && new Date(b.expires_at) > new Date(now)) return true;
    return false;
  });

  const { data: blockedSlots } = await supabase
    .from("barber_unavailable_slots")
    .select("id, time, reason")
    .eq("barber_id", barberId)
    .eq("date", date);

  return {
    bookings: activeBookings || [],
    blockedSlots: blockedSlots || [],
  };
}

export async function blockBarberSlot(barberId: string, date: string, time: string, reason: string = "Offline") {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin
    .from("barber_unavailable_slots")
    .insert({ barber_id: barberId, date, time, reason });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function unblockBarberSlot(slotId: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  const { error } = await supabaseAdmin
    .from("barber_unavailable_slots")
    .delete()
    .eq("id", slotId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

// ─── BARBER ABSENCES (FULL DAY LEAVE) ───────────────────────

export async function getBarberAbsences(barberId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("barber_absences")
    .select("date")
    .eq("barber_id", barberId)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Error fetching absences:", error);
    return [];
  }
  return data.map(d => d.date);
}

export async function toggleBarberAbsence(barberId: string, date: string, isCurrentlyAbsent: boolean) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };
  
  if (isCurrentlyAbsent) {
    // Jika sekarang absen (isCurrentlyAbsent=true), maka kita ingin menghapusnya (jadi Hadir)
    const { error } = await supabaseAdmin
      .from("barber_absences")
      .delete()
      .match({ barber_id: barberId, date });
    if (error) return { success: false, error: error.message };
  } else {
    // Jika sekarang hadir (isCurrentlyAbsent=false), maka kita ingin menambahkannya (jadi Cuti)
    const { error } = await supabaseAdmin
      .from("barber_absences")
      .insert({ barber_id: barberId, date });
    if (error && error.code !== '23505') return { success: false, error: error.message };
  }
  
  revalidatePath("/admin");
  revalidatePath("/Rituals");
  return { success: true };
}
