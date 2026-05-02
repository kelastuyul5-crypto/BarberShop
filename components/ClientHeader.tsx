"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import ProfileHeader from "./ProfileHeader";

export default function ClientHeader() {
  const pathname = usePathname();

  // Render the ProfileHeader on the Profile page (case-insensitive check)
  if (pathname.toLowerCase().startsWith("/profile")) {
    return <ProfileHeader />;
  }

  return <Header />;
}
