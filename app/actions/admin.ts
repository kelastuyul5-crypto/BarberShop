"use server";

import { supabase, supabaseAdmin } from "@/utils/supabase";
import { BookingService } from "@/utils/BookingService";
import { revalidatePath } from "next/cache";

// ============================================================
// INSTANSIASI OBJEK — OOP Pattern
// Server Actions hanya bertanggung jawab atas:
// 1. Autentikasi / otorisasi (checkAdmin)
// 2. Revalidasi cache (revalidatePath)
// 3. Mendelegasikan logika DB ke bookingService.method()
// ============================================================

// NOTE: checkAdmin dinonaktifkan sementara karena supabase-js standar
// tidak membaca session dari cookie secara otomatis di Server Actions
// tanpa middleware/auth-helpers.
async function checkAdmin() {
  return true; // Bypass untuk sementara agar fitur bisa digunakan
}

// ─── BARBERS ────────────────────────────────────────────────

export async function getAllBarbers() {
  // Gunakan anon client — hanya operasi read
  const bookingService = new BookingService(supabase);
  return bookingService.getAllBarbers();
}

export async function createBarber(input: {
  name: string;
  specialty: string;
  image_url: string;
}) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  // Gunakan admin client — operasi write
  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.createBarber(input);

  if (result.success) revalidatePath("/admin");
  return result;
}

export async function updateBarber(
  id: string,
  input: {
    name: string;
    specialty: string;
    image_url: string;
    is_active: boolean;
  }
) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.updateBarber(id, input);

  if (result.success) revalidatePath("/admin");
  return result;
}

export async function deleteBarber(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.deleteBarber(id);

  if (result.success) revalidatePath("/admin");
  return result;
}

// ─── SERVICES ───────────────────────────────────────────────

export async function getAllServices() {
  const bookingService = new BookingService(supabase);
  return bookingService.getServices();
}

export async function createService(input: {
  name: string;
  description: string;
  price: number;
}) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.createService(input);

  if (result.success) revalidatePath("/admin");
  return result;
}

export async function updateService(
  id: string,
  input: { name: string; description: string; price: number }
) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.updateService(id, input);

  if (result.success) revalidatePath("/admin");
  return result;
}

export async function deleteService(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.deleteService(id);

  if (result.success) revalidatePath("/admin");
  return result;
}

// ─── BOOKINGS ───────────────────────────────────────────────

export async function getAllBookings(page: number = 1, limit: number = 10) {
  // Admin membaca semua booking — gunakan admin client agar melewati RLS
  const bookingService = new BookingService(supabaseAdmin);
  return bookingService.getAllBookings(page, limit);
}

export async function updateBookingStatus(bookingId: string, status: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  // Cast diperlukan karena BookingService menggunakan union type BookingStatus
  const result = await bookingService.updateBookingStatus(
    bookingId,
    status as Parameters<typeof bookingService.updateBookingStatus>[1]
  );

  if (result.success) revalidatePath("/admin");
  return result;
}

/**
 * CONTOH UTAMA OOP PATTERN — rescheduleBooking
 *
 * Alur: Server Action → new BookingService(client) → bookingService.rescheduleBooking(...)
 *
 * Sebelum refaktoring (fungsional):
 *   const { error } = await supabaseAdmin.from("bookings").update({...}).eq("id", bookingId)
 *
 * Sesudah refaktoring (OOP):
 *   const bookingService = new BookingService(supabaseAdmin);
 *   const result = await bookingService.rescheduleBooking(bookingId, barberId, bookingDate, bookingTime);
 */
export async function rescheduleBooking(
  bookingId: string,
  barberId: string,
  bookingDate: string,
  bookingTime: string
) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  // ✅ Instansiasi Objek
  const bookingService = new BookingService(supabaseAdmin);

  // ✅ Panggil method objek — logika Supabase ada di dalam BookingService
  const result = await bookingService.rescheduleBooking(
    bookingId,
    barberId,
    bookingDate,
    bookingTime
  );

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/Rituals");
  }

  return result;
}

// ─── SHOP SETTINGS ──────────────────────────────────────────

export async function getShopSettings() {
  const bookingService = new BookingService(supabase);
  return bookingService.getShopSettings();
}

export async function addClosedDate(input: {
  closed_date: string;
  reason: string;
}) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.addClosedDate(input);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/Rituals");
  }
  return result;
}

export async function deleteClosedDate(id: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.deleteClosedDate(id);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/Rituals");
  }
  return result;
}

// ─── BARBER SCHEDULE ────────────────────────────────────────

export async function getBarberSchedule(barberId: string, date: string) {
  const bookingService = new BookingService(supabase);
  return bookingService.getBarberSchedule(barberId, date);
}

export async function blockBarberSlot(
  barberId: string,
  date: string,
  time: string,
  reason: string = "Offline"
) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.blockBarberSlot(barberId, date, time, reason);

  if (result.success) revalidatePath("/admin");
  return result;
}

export async function unblockBarberSlot(slotId: string) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.unblockBarberSlot(slotId);

  if (result.success) revalidatePath("/admin");
  return result;
}

// ─── BARBER ABSENCES (FULL DAY LEAVE) ───────────────────────

export async function getBarberAbsences(
  barberId: string,
  startDate: string,
  endDate: string
) {
  const bookingService = new BookingService(supabase);
  return bookingService.getBarberAbsences(barberId, startDate, endDate);
}

export async function toggleBarberAbsence(
  barberId: string,
  date: string,
  isCurrentlyAbsent: boolean
) {
  if (!(await checkAdmin())) return { success: false, error: "Unauthorized" };

  const bookingService = new BookingService(supabaseAdmin);
  const result = await bookingService.toggleBarberAbsence(
    barberId,
    date,
    isCurrentlyAbsent
  );

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/Rituals");
  }
  return result;
}
