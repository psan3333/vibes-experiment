'use client';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth-context";
import { YandexMapsProvider } from "@/contexts/YandexMapsContext";

const queryClient = new QueryClient();

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <YandexMapsProvider>
          {children}
        </YandexMapsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
