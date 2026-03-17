'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useYandexMaps } from '@/contexts/YandexMapsContext';

interface YandexMapProps {
  center: [number, number];
  zoom?: number;
  markers?: Array<{
    id: number;
    coordinates: [number, number];
    title: string;
    onClick?: () => void;
  }>;
  onMapClick?: (coordinates: [number, number]) => void;
  className?: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

export const YandexMap: React.FC<YandexMapProps> = ({
  center,
  zoom = 10,
  markers = [],
  onMapClick,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const { isLoaded } = useYandexMaps();

  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    // Check if ymaps.Map is available
    if (!window.ymaps || !window.ymaps.Map) {
      console.error('Yandex Maps API not properly loaded');
      return;
    }

    try {
      const newMap = new window.ymaps.Map(mapRef.current, {
        center,
        zoom,
        controls: ['zoomControl', 'fullscreenControl'],
      });

      // Add click event listener
      newMap.events.add('click', (e: any) => {
        const coords = e.get('coords');
        if (onMapClick) {
          onMapClick(coords);
        }
      });

      setMap(newMap);

      return () => {
        if (newMap) {
          newMap.destroy();
        }
      };
    } catch (error) {
      console.error('Error creating Yandex Map:', error);
    }
  }, [isLoaded, center, zoom]);

  // Update markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    map.geoObjects.removeAll();

    // Add new markers
    markers.forEach((marker) => {
      const placemark = new window.ymaps.Placemark(
        marker.coordinates,
        {
          hintContent: marker.title,
          balloonContent: marker.title,
        },
        {
          preset: 'islands#icon',
          iconColor: '#735184',
        }
      );

      if (marker.onClick) {
        placemark.events.add('click', marker.onClick);
      }

      map.geoObjects.add(placemark);
    });
  }, [map, markers]);

  // Update map center
  useEffect(() => {
    if (map) {
      map.setCenter(center, zoom, {
        duration: 300,
      });
    }
  }, [map, center, zoom]);

  return (
    <div className={`w-full h-full ${className} relative`}>
      <div ref={mapRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      {isLoaded && !map && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
    </div>
  );
};