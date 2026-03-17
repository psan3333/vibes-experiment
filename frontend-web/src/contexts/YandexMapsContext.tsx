'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface YandexMapsContextType {
  isLoaded: boolean;
}

const YandexMapsContext = createContext<YandexMapsContextType>({ isLoaded: false });

export function YandexMapsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Yandex Maps is already loaded and ready
    if (window.ymaps && window.ymaps.Map) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already added to document
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
    if (existingScript) {
      // Script is already loading, wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.ymaps && window.ymaps.Map) {
          clearInterval(checkLoaded);
          setIsLoaded(true);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
      }, 10000);
      
      return;
    }

    // Load Yandex Maps script
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''}&lang=en_US`;
    script.onload = () => {
      // The script loaded, now wait for ymaps.ready
      if (window.ymaps && window.ymaps.ready) {
        window.ymaps.ready(() => {
          setIsLoaded(true);
        });
      } else {
        // If ymaps.ready is not available yet, check again after a delay
        setTimeout(() => {
          if (window.ymaps && window.ymaps.Map) {
            setIsLoaded(true);
          } else {
            console.error('Yandex Maps API not properly initialized');
          }
        }, 1000);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Yandex Maps script');
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
