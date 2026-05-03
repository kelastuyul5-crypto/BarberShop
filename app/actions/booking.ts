"use server";

import { supabase, supabaseAdmin } from "@/utils/supabase";
import { revalidatePath } from "next/cache";

// No more hardcoded dummy user — userId is passed from the authenticated client

export async function autoCancelExpiredBookings() {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("status", "awaiting_payment")
    .lt("expires_at", now);
    
  if (error) {
    console.error("Error auto-cancelling bookings:", error);
  }
}

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

export async function getAbsentBarbers(date: string) {
  const { data, error } = await supabase
    .from("barber_absences")
    .select("barber_id")
    .eq("date", date);

  if (error) {
    console.error("Error fetching absent barbers:", error);
    return [];
  }
  return data.map(d => d.barber_id);
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
  // Bersihkan dulu booking yang sudah expired
  await autoCancelExpiredBookings();

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

  // Juga ambil slot yang diblokir admin
  const { data: blockedSlots } = await supabase
    .from("barber_unavailable_slots")
    .select("time")
    .eq("barber_id", barberId)
    .eq("date", date);

  const blockedTimes = (blockedSlots || []).map(s => s.time);

  // Gabungkan dan hilangkan duplikat
  return [...new Set([...bookedTimes, ...blockedTimes])];
}

export async function checkUserActiveBooking(userId: string) {
  if (!userId) return { hasActive: false };

  await autoCancelExpiredBookings();

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

  // Validasi Cuti (Absence)
  const { data: absence } = await supabase
    .from("barber_absences")
    .select("id")
    .eq("barber_id", input.barberId)
    .eq("date", input.date)
    .maybeSingle();

  if (absence) {
    return { success: false, error: "Barber sedang cuti pada tanggal ini." };
  }

  // Validasi Time Travel
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]; // asumsikan zona waktu server & klien mirip, atau gunakan util
  // Untuk amannya, kita parse manual
  const tzOffset = 7 * 60 * 60 * 1000; // WIB (UTC+7)
  const localNow = new Date(now.getTime() + tzOffset);
  const localTodayStr = localNow.toISOString().split('T')[0];

  if (input.date === localTodayStr) {
    const timeMatch = input.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      
      const selectedTimeMins = hours * 60 + minutes;
      const currentTimeMins = localNow.getUTCHours() * 60 + localNow.getUTCMinutes(); // getUTCHours krn localNow sdh ditambah offset
      
      if (selectedTimeMins <= currentTimeMins) {
        return { success: false, error: "Waktu yang dipilih sudah lewat." };
      }
    }
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
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("payment-proofs")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    // Update status to pending_confirmation
    const { error: updateError } = await supabaseAdmin
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

export async function getClosedDates() {
  const { data, error } = await supabase
    .from("shop_settings")
    .select("closed_date");

  if (error) {
    console.error("Error fetching closed dates:", error);
    return [];
  }
  return data.map(row => row.closed_date);
}

export async function getBookingHistory(userId: string, page: number, limit: number = 5) {
  await autoCancelExpiredBookings();
  
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
