"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuBookOpen, LuScissors, LuHistory, LuUser } from "react-icons/lu";

export default function Footer() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "JOURNAL",
      href: "/Journal",
      icon: LuBookOpen,
    },
    {
      name: "RITUALS",
      href: "/Rituals",
      icon: LuScissors,
    },
    {
      name: "HISTORY",
      href: "/History",
      icon: LuHistory,
    },
    {
      name: "PROFILE",
      href: "/Profile",
      icon: LuUser,
    },
  ];

  return (
    <footer className="fixed bottom-0 left-0 z-50 w-full bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5">
      <div className="flex h-[72px] items-center justify-around px-2 w-full max-w-md md:max-w-2xl mx-auto">
        {navItems.map((item) => {
          // Allow loose matching for demo purposes or exact matching
          const isActive = pathname?.startsWith(item.href) || pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all duration-300 ${
                isActive ? "text-[#D4AF37] scale-110" : "text-[#737373] hover:text-[#a3a3a3] hover:scale-105"
              }`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-[0.08em]">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}

