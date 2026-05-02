import Link from "next/link";
import Image from "next/image";
import { RiProfileLine } from "react-icons/ri";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-[#C5A059]/20 px-6 py-4 flex items-center justify-between">
      {/* Left spacer */}
      <div className="w-10" />

      {/* Centered Logo */}
      <div className="flex flex-col items-center">
        <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">
          HERITAGE
        </span>
        <span className="text-[#C5A059] font-serif text-sm font-bold tracking-[0.3em] leading-tight">
          ATELIER
        </span>
      </div>

      {/* Profile Pic */}
      <div className="relative w-10 h-10 rounded-full border border-[#C5A059]/50 overflow-hidden flex items-center justify-center bg-[#1a1a1a]">
        <RiProfileLine className="w-6 h-6 text-[#C5A059]"/>
      </div>
    </header>
  );
}
