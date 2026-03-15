"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/start");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Redirecting…
    </div>
  );
}
