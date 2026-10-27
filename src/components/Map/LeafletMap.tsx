'use client';

import React, { useEffect, useRef } from 'react';
import { Complaint, BarangayProject } from '@/lib/types';

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  complaints?: Complaint[];
  projects?: BarangayProject[];
  selectedLocation?: [number, number] | null;
  onSelectLocation?: (lat: number, lng: number) => void;
  interactiveSelect?: boolean;
  layerMode?: 'all' | 'markers' | 'heatmap';
  tileStyle?: 'osm' | 'voyager';
}

export default function LeafletMap({
  center = [10.7314, 122.5228], // Barangay Hibao-an Sur, Mandurriao, Iloilo City
  zoom = 15,
  complaints = [],
  projects = [],
  selectedLocation = null,
  onSelectLocation,
  interactiveSelect = false,
  layerMode = 'all',
  tileStyle = 'osm'
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const heatmapLayerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      
      const L = (await import('leaflet')).default;

      // Leaflet default asset setup
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView(center, zoom);
        
        mapInstanceRef.current = map;

        // Tile layer
        const tileUrl = tileStyle === 'voyager'
          ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        L.tileLayer(tileUrl, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        }).addTo(map);

        heatmapLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);

        if (interactiveSelect && onSelectLocation) {
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            onSelectLocation(lat, lng);
          });
        }
      }

      // Update layers
      if (markersLayerRef.current && heatmapLayerRef.current && mapInstanceRef.current) {
        const markerLayer = markersLayerRef.current;
        const heatLayer = heatmapLayerRef.current;
        markerLayer.clearLayers();
        heatLayer.clearLayers();

        // 1. Render Interactive Selected Pin (for filing report)
        if (selectedLocation) {
          const pinIcon = L.divIcon({
            className: 'custom-pin',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute -top-6 bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                  Selected Pin
                </div>
                <div style="background-color: #2563eb; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(37,99,235,0.4); animation: bounce 1.2s infinite;"></div>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });
          L.marker(selectedLocation, { icon: pinIcon })
            .addTo(markerLayer)
            .bindPopup('<b>Selected Location Pin</b><br>Hibao-an Sur Pinpoint')
            .openPopup();
        }

        // 2. Render Heatmap Hotspot Density Circles (Module 6.2)
        if (layerMode === 'heatmap' || layerMode === 'all') {
          complaints.forEach((c) => {
            const radiusMeters = c.priority === 'High' ? 120 : c.priority === 'Medium' ? 85 : 55;
            const fillColor = c.priority === 'High' ? '#ef4444' : c.priority === 'Medium' ? '#f59e0b' : '#10b981';
            const fillOpacity = c.priority === 'High' ? 0.35 : 0.25;

            // Outer heat radius
            L.circle([c.latitude, c.longitude], {
              radius: radiusMeters,
              color: fillColor,
              weight: 1,
              opacity: 0.5,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
            }).addTo(heatLayer);

            // Core hotspot nucleus
            L.circle([c.latitude, c.longitude], {
              radius: radiusMeters * 0.35,
              color: fillColor,
              weight: 0,
              fillColor: fillColor,
              fillOpacity: fillOpacity + 0.25,
            }).addTo(heatLayer);
          });
        }

        // 3. Render Individual Complaint Markers
        if (layerMode === 'markers' || layerMode === 'all') {
          complaints.forEach((c) => {
            const color = c.priority === 'High' ? '#ef4444' : c.priority === 'Medium' ? '#f59e0b' : '#10b981';
            const markerIcon = L.divIcon({
              className: 'complaint-pin',
              html: `
                <div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                  <span style="width: 5px; height: 5px; background: white; border-radius: 50%;"></span>
                </div>
              `,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });

            const popupContent = `
              <div style="font-family: system-ui, sans-serif; font-size: 12px; width: 220px; padding: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-family: monospace; font-size: 10px; font-weight: 700; color: #2563eb;">${c.tracking_number}</span>
                  <span style="background: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">
                    ${c.priority} Priority
                  </span>
                </div>
                <h4 style="font-weight: 700; font-size: 13px; margin: 0 0 4px 0; color: #0f172a; line-height: 1.3;">${c.title}</h4>
                <p style="margin: 0 0 6px 0; color: #475569; font-size: 11px; line-height: 1.4;">${c.location_address}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px;">
                  <span style="font-size: 10px; color: #64748b;">Status: <strong style="color: #0f172a;">${c.status}</strong></span>
                  <a href="/track?id=${c.tracking_number}" style="color: #2563eb; font-weight: 600; text-decoration: none; font-size: 10px;">Track →</a>
                </div>
              </div>
            `;

            L.marker([c.latitude, c.longitude], { icon: markerIcon })
              .addTo(markerLayer)
              .bindPopup(popupContent);
          });
        }

        // 4. Render Barangay Projects
        projects.forEach((p) => {
          const projectIcon = L.divIcon({
            className: 'project-pin',
            html: `
              <div style="background-color: #4f46e5; width: 22px; height: 22px; border-radius: 6px; border: 2px solid white; box-shadow: 0 3px 8px rgba(79,70,229,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 800;">
                P
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          L.marker([p.latitude, p.longitude], { icon: projectIcon })
            .addTo(markerLayer)
            .bindPopup(`
              <div style="font-family: system-ui, sans-serif; font-size: 12px; width: 220px;">
                <span style="font-size: 9px; background: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">
                  Barangay Project
                </span>
                <h4 style="font-weight: 700; font-size: 13px; margin: 4px 0 2px 0; color: #0f172a;">${p.title}</h4>
                <p style="color: #64748b; font-size: 11px; margin: 0 0 4px 0;">${p.location_address}</p>
                <div style="background: #f8fafc; border-radius: 6px; padding: 6px; margin-top: 4px; font-size: 11px;">
                  <p style="margin: 0; color: #334155;">Status: <strong style="color: #2563eb;">${p.status}</strong></p>
                  <p style="margin: 2px 0 0 0; color: #334155;">Allocated Budget: <strong>₱${p.budget.toLocaleString()}</strong></p>
                </div>
              </div>
            `);
        });
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, complaints, projects, selectedLocation, interactiveSelect, onSelectLocation, layerMode, tileStyle]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full" />
      {interactiveSelect && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-md z-[400] flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Click anywhere on the map to place your incident pin</span>
        </div>
      )}
    </div>
  );
}
