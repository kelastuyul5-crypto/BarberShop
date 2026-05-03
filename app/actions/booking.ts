"use server";

import { supabase } from "@/utils/supabase";
import { revalidatePath } from "next/cache";

// No more hardcoded dummy user — userId is passed from the authenticated client

export async function getBarbers() {
  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching barbers:", error);
    return [];
  }
  return data;
}

export async function getServices() {
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

export async function checkAvailability(date: string, barberId: string) {
  // Ambil booking dengan status 'confirmed', 'pending_confirmation' ATAU 'awaiting_payment' yang belum expired
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from("bookings")
    .select("booking_time, status, expires_at")
    .eq("booking_date", date)
    .eq("barber_id", barberId);

  if (error) {
    console.error("Error checking availability:", error);
    return [];
  }

  // Filter di sisi server
  const bookedTimes = data
    .filter(booking => {
      if (booking.status === "confirmed" || booking.status === "pending_confirmation") {
        return true;
      }
      if (booking.status === "awaiting_payment" && new Date(booking.expires_at) > new Date(now)) {
        return true;
      }
      return false;
    })
    .map(booking => booking.booking_time);

  return bookedTimes;
}

export async function checkUserActiveBooking(userId: string) {
  if (!userId) return { hasActive: false };

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_time, booking_date, expires_at")
    .eq("user_id", userId)
    .eq("status", "awaiting_payment")
    .gt("expires_at", now)
    .limit(1);

  if (error) {
    console.error("Error checking active booking:", error);
    return { hasActive: false };
  }

  if (data && data.length > 0) {
    return { hasActive: true, bookingId: data[0].id };
  }

  return { hasActive: false };
}

interface CreateBookingInput {
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string;
  serviceIds: string[];
  totalPrice: number;
  servicesWithPrices: { id: string; price: number }[];
}

export async function createBookingHold(input: CreateBookingInput, userId: string) {
  if (!userId) return { success: false, error: "User belum login." };

  // Anti-troll: cek apakah user masih punya booking aktif yang belum dibayar
  const activeCheck = await checkUserActiveBooking(userId);
  if (activeCheck.hasActive) {
    return { success: false, error: "Anda masih memiliki pesanan yang belum dibayar. Selesaikan atau batalkan terlebih dahulu." };
  }

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // + 15 mins

  // 1. Insert ke tabel bookings
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      barber_id: input.barberId,
      booking_date: input.date,
      booking_time: input.time,
      total_price: input.totalPrice,
      status: "awaiting_payment",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (bookingError) {
    console.error("Error creating booking:", bookingError);
    return { success: false, error: bookingError.message };
  }

  // 2. Insert ke tabel booking_items
  const items = input.servicesWithPrices.map(s => ({
    booking_id: booking.id,
    service_id: s.id,
    price_at_booking: s.price
  }));

  const { error: itemsError } = await supabase
    .from("booking_items")
    .insert(items);

  if (itemsError) {
    console.error("Error creating booking items:", itemsError);
    return { success: false, error: itemsError.message };
  }

  revalidatePath("/Rituals");
  return { success: true, bookingId: booking.id, expiresAt: expiresAt.toISOString() };
}

export async function submitPaymentProof(bookingId: string, formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "File not provided" };

    // Upload to Supabase Storage
    // Asumsi ada bucket bernama "payment-proofs"
    const fileExt = file.name.split(".").pop();
    const fileName = `${bookingId}-${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    // Update status to pending_confirmation
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_proof_url: publicUrlData.publicUrl,
        status: "pending_confirmation"
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Error updating booking:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/History");
    return { success: true };
  } catch (err: any) {
    console.error("Error in submitPaymentProof:", err);
    return { success: false, error: err.message };
  }
}

export async function checkBookingStatus(bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("status, expires_at")
    .eq("id", bookingId)
    .single();

  if (error) {
    console.error("Error checking status:", error);
    return null;
  }
  return data;
}

export async function getBookingHistory(userId: string, page: number, limit: number = 5) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Since we don't have auth, fetch for dummy user
  const { data, error, count } = await supabase
    .from("bookings")
    .select(`
      id, booking_date, booking_time, total_price, status, expires_at, created_at,
      barber:barbers(name),
      items:booking_items(
        service:services(name)
      )
    `, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching history:", error);
    return { data: [], totalPages: 0 };
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;
  return { data, totalPages };
}

export async function cancelBooking(bookingId: string) {
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) {
    console.error("Error cancelling booking:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/History");
  revalidatePath("/Rituals");
  return { success: true };
}
