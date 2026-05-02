import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";

export default function ProfileHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-[#C5A059]/20 px-6 py-4 flex items-center">
      {/* Back Button */}
      <Link href="/" className="text-[#C5A059] hover:opacity-80 transition-opacity z-10">
        <IoArrowBack size={24} />
      </Link>

      {/* Centered Logo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">
          HERITAGE
        </span>
        <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">
          ATELIER
        </span>
      </div>
    </header>
  );
}
