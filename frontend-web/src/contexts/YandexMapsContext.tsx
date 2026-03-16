'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface YandexMapsContextType {
  isLoaded: boolean;
}

const YandexMapsContext = createContext<YandexMapsContextType>({ isLoaded: false });

export function YandexMapsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Yandex Maps script is already loaded or loading
    if (typeof window !== 'undefined' && window.ymaps && window.ymaps.ready) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already added to document
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript) {
      // Script is already loading, wait for it to load
      const checkLoaded = setInterval(() => {
        if (typeof window !== 'undefined' && window.ymaps && window.ymaps.ready) {
          clearInterval(checkLoaded);
          setIsLoaded(true);
        }
      }, 100);
      return;
    }

    // Load Yandex Maps script
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''}&lang=en_US`;
    script.onload = () => {
      if (typeof window !== 'undefined' && window.ymaps) {
        window.ymaps.ready(() => {
          setIsLoaded(true);
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove the script as it might be used by other components
    };
  }, []);

  return (
    <YandexMapsContext.Provider value={{ isLoaded }}>
      {children}
    </YandexMapsContext.Provider>
  );
}

export function useYandexMaps() {
  return useContext(YandexMapsContext);
}
