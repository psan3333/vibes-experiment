'use client';

import { AuthProvider } from "@/contexts/auth-context";
import { EventsProvider } from "@/contexts/events-context";
import { BottomNav } from "@/components/BottomNav";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <EventsProvider>
        <BottomNav />
        {children}
      </EventsProvider>
    </AuthProvider>
  );
}
