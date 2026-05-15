"use server";

import { supabase, supabaseAdmin } from "@/utils/supabase";
import { BookingService, CreateBookingInput } from "@/utils/BookingService";
import { revalidatePath } from "next/cache";

// ============================================================
// INSTANSIASI OBJEK — OOP Pattern
// Setiap Server Action membuat instansi BookingService
// dan mendelegasikan logika database ke method-nya.
// ============================================================

export async function autoCancelExpiredBookings() {
  const bookingService = new BookingService(supabase);
  await bookingService.autoCancelExpiredBookings();
}

export async function getBarbers() {
  const bookingService = new BookingService(supabase);
  return bookingService.getBarbers();
}

export async function getAbsentBarbers(date: string) {
  const bookingService = new BookingService(supabase);
  return bookingService.getAbsentBarbers(date);
}

export async function getServices() {
  const bookingService = new BookingService(supabase);
  return bookingService.getServices();
}

/** Ambil services yang tersedia untuk barber tertentu (berdasarkan barber_services table). */
export async function getServicesForBarber(barberId: string) {
  const bookingService = new BookingService(supabase);
  return bookingService.getServicesForBarber(barberId);
}

export async function checkAvailability(date: string, barberId: string) {
  const bookingService = new BookingService(supabase);
  // Signature dibalik agar sesuai OOP method (barberId, date)
  return bookingService.checkAvailability(barberId, date);
}

export async function checkUserActiveBooking(userId: string) {
  const bookingService = new BookingService(supabase);
  return bookingService.checkUserActiveBooking(userId);
}

export async function createBookingHold(
  input: CreateBookingInput,
  userId: string
) {
  // Gunakan supabase biasa (anon key) untuk booking user
  const bookingService = new BookingService(supabase);
  const result = await bookingService.createBooking(input, userId);

  if (result.success) {
    revalidatePath("/Rituals");
  }

  return result;
}

export async function submitPaymentProof(
  bookingId: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "File not provided" };

    // Upload ke Supabase Storage — tetap di Server Action karena
    // melibatkan Storage API yang bukan bagian dari BookingService
    const fileExt = file.name.split(".").pop();
    const fileName = `${bookingId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("payment-proofs")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    // Update status menggunakan admin client (butuh service role)
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_proof_url: publicUrlData.publicUrl,
        status: "pending_confirmation",
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Error updating booking:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/History");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in submitPaymentProof:", message);
    return { success: false, error: message };
  }
}

export async function checkBookingStatus(bookingId: string) {
  const bookingService = new BookingService(supabase);
  return bookingService.getBookingStatus(bookingId);
}

export async function getClosedDates() {
  const bookingService = new BookingService(supabase);
  return bookingService.getClosedDates();
}

export async function getBookingHistory(
  userId: string,
  page: number,
  limit: number = 5
) {
  const bookingService = new BookingService(supabase);
  return bookingService.getBookingHistory(userId, page, limit);
}

export async function cancelBooking(bookingId: string) {
  const bookingService = new BookingService(supabase);
  const result = await bookingService.cancelBooking(bookingId);

  if (result.success) {
    revalidatePath("/History");
    revalidatePath("/Rituals");
  }

  return result;
}
