import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// ABSTRACTION LAYER — Interface & Type Definitions
// ============================================================

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  created_at: string;
}

export interface BookingItem {
  service_id: string;
  price_at_booking: number;
}

export interface Booking {
  id: string;
  user_id: string;
  barber_id: string;
  booking_date: string;
  booking_time: string;
  total_price: number;
  status: BookingStatus;
  expires_at: string;
  created_at: string;
  payment_proof_url?: string;
}

export type BookingStatus =
  | "awaiting_payment"
  | "pending_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface CreateBookingInput {
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string;
  serviceIds: string[];
  totalPrice: number;
  servicesWithPrices: { id: string; price: number }[];
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface CreateBookingResult extends ActionResult {
  bookingId?: string;
  expiresAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  totalPages: number;
}

export interface BarberScheduleResult {
  bookings: object[];
  blockedSlots: object[];
}

// ============================================================
// ENCAPSULATION — BookingService Class
// ============================================================

export class BookingService {
  private readonly db: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.db = supabaseClient;
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Expired Bookings Cleanup
  // ──────────────────────────────────────────────────────────

  /**
   * Membatalkan semua booking yang melewati batas waktu pembayaran.
   */
  async autoCancelExpiredBookings(): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.db
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("status", "awaiting_payment")
      .lt("expires_at", now);

    if (error) {
      console.error("[BookingService] Error auto-cancelling bookings:", error);
    }
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Read Operations
  // ──────────────────────────────────────────────────────────

  /** Mengambil semua barber yang aktif. */
  async getBarbers(): Promise<Barber[]> {
    const { data, error } = await this.db
      .from("barbers")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[BookingService] Error fetching barbers:", error);
      return [];
    }
    return data as Barber[];
  }

  /** Mengambil semua barber (termasuk yang nonaktif) untuk keperluan admin. */
  async getAllBarbers(): Promise<Barber[]> {
    const { data, error } = await this.db
      .from("barbers")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[BookingService] Error fetching all barbers:", error);
      return [];
    }
    return data as Barber[];
  }

  /** Mengambil semua layanan yang tersedia. */
  async getServices(): Promise<Service[]> {
    const { data, error } = await this.db
      .from("services")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[BookingService] Error fetching services:", error);
      return [];
    }
    return data as Service[];
  }

  /** Mengambil ID barber yang sedang cuti pada tanggal tertentu. */
  async getAbsentBarbers(date: string): Promise<string[]> {
    const { data, error } = await this.db
      .from("barber_absences")
      .select("barber_id")
      .eq("date", date);

    if (error) {
      console.error("[BookingService] Error fetching absent barbers:", error);
      return [];
    }
    return data.map((d) => d.barber_id);
  }

  /** Mengambil semua tanggal tutup toko. */
  async getClosedDates(): Promise<string[]> {
    const { data, error } = await this.db
      .from("shop_settings")
      .select("closed_date");

    if (error) {
      console.error("[BookingService] Error fetching closed dates:", error);
      return [];
    }
    return data.map((row) => row.closed_date);
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Availability
  // ──────────────────────────────────────────────────────────

  /**
   * Mengecek slot waktu yang sudah terisi untuk barber pada tanggal tertentu.
   * Menggabungkan booking aktif dengan slot yang diblokir admin.
   *
   * @param barberId - UUID barber
   * @param date     - Tanggal dalam format YYYY-MM-DD
   * @returns Array of booked/blocked time strings
   */
  async checkAvailability(barberId: string, date: string): Promise<string[]> {
    await this.autoCancelExpiredBookings();

    const now = new Date().toISOString();

    const { data, error } = await this.db
      .from("bookings")
      .select("booking_time, status, expires_at")
      .eq("booking_date", date)
      .eq("barber_id", barberId);

    if (error) {
      console.error("[BookingService] Error checking availability:", error);
      return [];
    }

    const bookedTimes = data
      .filter((booking) => {
        if (
          booking.status === "confirmed" ||
          booking.status === "pending_confirmation"
        ) {
          return true;
        }
        if (
          booking.status === "awaiting_payment" &&
          new Date(booking.expires_at) > new Date(now)
        ) {
          return true;
        }
        return false;
      })
      .map((booking) => booking.booking_time);

    const { data: blockedSlots } = await this.db
      .from("barber_unavailable_slots")
      .select("time")
      .eq("barber_id", barberId)
      .eq("date", date);

    const blockedTimes = (blockedSlots || []).map((s) => s.time);

    return [...new Set([...bookedTimes, ...blockedTimes])];
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Create Operations
  // ──────────────────────────────────────────────────────────

  /**
   * Membuat booking hold selama 15 menit untuk user.
   * Melakukan validasi cuti barber, time travel, dan active booking.
   */
  async createBooking(
    input: CreateBookingInput,
    userId: string
  ): Promise<CreateBookingResult> {
    if (!userId) return { success: false, error: "User belum login." };

    // Cek booking aktif yang belum dibayar
    const activeCheck = await this.checkUserActiveBooking(userId);
    if (activeCheck.hasActive) {
      return {
        success: false,
        error:
          "Anda masih memiliki pesanan yang belum dibayar. Selesaikan atau batalkan terlebih dahulu.",
      };
    }

    // Validasi cuti barber
    const { data: absence } = await this.db
      .from("barber_absences")
      .select("id")
      .eq("barber_id", input.barberId)
      .eq("date", input.date)
      .maybeSingle();

    if (absence) {
      return { success: false, error: "Barber sedang cuti pada tanggal ini." };
    }

    // Validasi Time Travel (WIB UTC+7)
    const tzOffset = 7 * 60 * 60 * 1000;
    const localNow = new Date(new Date().getTime() + tzOffset);
    const localTodayStr = localNow.toISOString().split("T")[0];

    if (input.date === localTodayStr) {
      const timeMatch = input.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3].toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;

        const selectedTimeMins = hours * 60 + minutes;
        const currentTimeMins =
          localNow.getUTCHours() * 60 + localNow.getUTCMinutes();

        if (selectedTimeMins <= currentTimeMins) {
          return { success: false, error: "Waktu yang dipilih sudah lewat." };
        }
      }
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Insert booking
    const { data: booking, error: bookingError } = await this.db
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
      console.error("[BookingService] Error creating booking:", bookingError);
      return { success: false, error: bookingError.message };
    }

    // Insert booking items
    const items = input.servicesWithPrices.map((s) => ({
      booking_id: booking.id,
      service_id: s.id,
      price_at_booking: s.price,
    }));

    const { error: itemsError } = await this.db
      .from("booking_items")
      .insert(items);

    if (itemsError) {
      console.error(
        "[BookingService] Error creating booking items:",
        itemsError
      );
      return { success: false, error: itemsError.message };
    }

    return {
      success: true,
      bookingId: booking.id,
      expiresAt: expiresAt.toISOString(),
    };
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Update Operations
  // ──────────────────────────────────────────────────────────

  /**
   * Menjadwalkan ulang booking oleh admin.
   * Mengubah barber, tanggal, dan jam booking.
   *
   * @param bookingId   - UUID booking yang akan diubah
   * @param barberId    - UUID barber baru
   * @param newDate     - Tanggal baru (YYYY-MM-DD)
   * @param newTime     - Waktu baru (string)
   * @returns ActionResult { success, error? }
   */
  async rescheduleBooking(
    bookingId: string,
    barberId: string,
    newDate: string,
    newTime: string
  ): Promise<ActionResult> {
    const { error } = await this.db
      .from("bookings")
      .update({
        barber_id: barberId,
        booking_date: newDate,
        booking_time: newTime,
      })
      .eq("id", bookingId);

    if (error) {
      console.error("[BookingService] Error rescheduling booking:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /** Memperbarui status booking. */
  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<ActionResult> {
    const { error } = await this.db
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Membatalkan booking berdasarkan ID. */
  async cancelBooking(bookingId: string): Promise<ActionResult> {
    const { error } = await this.db
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      console.error("[BookingService] Error cancelling booking:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: User-Specific Queries
  // ──────────────────────────────────────────────────────────

  /** Mengecek apakah user memiliki booking aktif yang belum dibayar. */
  async checkUserActiveBooking(
    userId: string
  ): Promise<{ hasActive: boolean; bookingId?: string }> {
    if (!userId) return { hasActive: false };

    await this.autoCancelExpiredBookings();
    const now = new Date().toISOString();

    const { data, error } = await this.db
      .from("bookings")
      .select("id, booking_time, booking_date, expires_at")
      .eq("user_id", userId)
      .eq("status", "awaiting_payment")
      .gt("expires_at", now)
      .limit(1);

    if (error) {
      console.error(
        "[BookingService] Error checking active booking:",
        error
      );
      return { hasActive: false };
    }

    if (data && data.length > 0) {
      return { hasActive: true, bookingId: data[0].id };
    }
    return { hasActive: false };
  }

  /** Mengambil status dan waktu kadaluarsa satu booking. */
  async getBookingStatus(
    bookingId: string
  ): Promise<{ status: string; expires_at: string } | null> {
    const { data, error } = await this.db
      .from("bookings")
      .select("status, expires_at")
      .eq("id", bookingId)
      .single();

    if (error) {
      console.error("[BookingService] Error checking status:", error);
      return null;
    }
    return data;
  }

  /** Mengambil riwayat booking milik user dengan paginasi. */
  async getBookingHistory(
    userId: string,
    page: number,
    limit: number = 5
  ): Promise<PaginatedResult<object>> {
    await this.autoCancelExpiredBookings();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.db
      .from("bookings")
      .select(
        `
        id, booking_date, booking_time, total_price, status, expires_at, created_at,
        barber:barbers(name),
        items:booking_items(
          service:services(name)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[BookingService] Error fetching history:", error);
      return { data: [], totalPages: 0 };
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;
    return { data: data ?? [], totalPages };
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Admin — All Bookings
  // ──────────────────────────────────────────────────────────

  /** Mengambil semua booking dengan paginasi untuk tampilan admin. */
  async getAllBookings(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<object>> {
    await this.autoCancelExpiredBookings();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.db
      .from("bookings")
      .select(
        `
        *,
        user:profiles(full_name, email),
        barber:barbers(name),
        items:booking_items(
          price_at_booking,
          service:services(name)
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[BookingService] Error fetching all bookings:", error);
      return { data: [], totalPages: 0 };
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;
    return { data: data ?? [], totalPages };
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Admin — Barber Schedule & Slots
  // ──────────────────────────────────────────────────────────

  /** Mengambil jadwal barber pada tanggal tertentu beserta slot yang diblokir. */
  async getBarberSchedule(
    barberId: string,
    date: string
  ): Promise<BarberScheduleResult> {
    const now = new Date().toISOString();

    const { data: bookings } = await this.db
      .from("bookings")
      .select(
        `booking_time, status, expires_at, user:profiles(full_name, email)`
      )
      .eq("barber_id", barberId)
      .eq("booking_date", date);

    const activeBookings = (bookings || []).filter((b) => {
      if (
        b.status === "confirmed" ||
        b.status === "pending_confirmation" ||
        b.status === "completed"
      )
        return true;
      if (
        b.status === "awaiting_payment" &&
        new Date(b.expires_at) > new Date(now)
      )
        return true;
      return false;
    });

    const { data: blockedSlots } = await this.db
      .from("barber_unavailable_slots")
      .select("id, time, reason")
      .eq("barber_id", barberId)
      .eq("date", date);

    return {
      bookings: activeBookings,
      blockedSlots: blockedSlots || [],
    };
  }

  /** Memblokir satu slot waktu barber. */
  async blockBarberSlot(
    barberId: string,
    date: string,
    time: string,
    reason: string = "Offline"
  ): Promise<ActionResult> {
    const { error } = await this.db
      .from("barber_unavailable_slots")
      .insert({ barber_id: barberId, date, time, reason });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Membuka kembali slot waktu barber yang sebelumnya diblokir. */
  async unblockBarberSlot(slotId: string): Promise<ActionResult> {
    const { error } = await this.db
      .from("barber_unavailable_slots")
      .delete()
      .eq("id", slotId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Admin — Barber Absences (Full Day Leave)
  // ──────────────────────────────────────────────────────────

  /** Mengambil tanggal-tanggal cuti seorang barber dalam rentang waktu. */
  async getBarberAbsences(
    barberId: string,
    startDate: string,
    endDate: string
  ): Promise<string[]> {
    const { data, error } = await this.db
      .from("barber_absences")
      .select("date")
      .eq("barber_id", barberId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("[BookingService] Error fetching absences:", error);
      return [];
    }
    return data.map((d) => d.date);
  }

  /** Toggle status cuti barber pada tanggal tertentu (hadir ↔ cuti). */
  async toggleBarberAbsence(
    barberId: string,
    date: string,
    isCurrentlyAbsent: boolean
  ): Promise<ActionResult> {
    if (isCurrentlyAbsent) {
      const { error } = await this.db
        .from("barber_absences")
        .delete()
        .match({ barber_id: barberId, date });
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await this.db
        .from("barber_absences")
        .insert({ barber_id: barberId, date });
      if (error && error.code !== "23505")
        return { success: false, error: error.message };
    }
    return { success: true };
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Admin — CRUD Barbers & Services
  // ──────────────────────────────────────────────────────────

  /** Membuat data barber baru. */
  async createBarber(input: {
    name: string;
    specialty: string;
    image_url: string;
  }): Promise<ActionResult> {
    const { error } = await this.db.from("barbers").insert(input);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Memperbarui data barber. */
  async updateBarber(
    id: string,
    input: {
      name: string;
      specialty: string;
      image_url: string;
      is_active: boolean;
    }
  ): Promise<ActionResult> {
    const { error } = await this.db
      .from("barbers")
      .update(input)
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Menghapus data barber. */
  async deleteBarber(id: string): Promise<ActionResult> {
    const { error } = await this.db
      .from("barbers")
      .delete()
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Membuat layanan baru. */
  async createService(input: {
    name: string;
    description: string;
    price: number;
  }): Promise<ActionResult> {
    const { error } = await this.db.from("services").insert(input);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Memperbarui data layanan. */
  async updateService(
    id: string,
    input: { name: string; description: string; price: number }
  ): Promise<ActionResult> {
    const { error } = await this.db
      .from("services")
      .update(input)
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Menghapus data layanan. */
  async deleteService(id: string): Promise<ActionResult> {
    const { error } = await this.db
      .from("services")
      .delete()
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ──────────────────────────────────────────────────────────
  // SECTION: Admin — Shop Settings
  // ──────────────────────────────────────────────────────────

  /** Mengambil semua pengaturan toko (tanggal tutup, dll). */
  async getShopSettings(): Promise<object[]> {
    const { data, error } = await this.db
      .from("shop_settings")
      .select("*")
      .order("closed_date", { ascending: true });

    if (error) {
      console.error("[BookingService] Error fetching shop settings:", error);
      return [];
    }
    return data;
  }

  /** Menambahkan tanggal tutup toko. */
  async addClosedDate(input: {
    closed_date: string;
    reason: string;
  }): Promise<ActionResult> {
    const { error } = await this.db.from("shop_settings").insert(input);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  /** Menghapus tanggal tutup toko berdasarkan ID. */
  async deleteClosedDate(id: string): Promise<ActionResult> {
    const { error } = await this.db
      .from("shop_settings")
      .delete()
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
}
