"use client";

import { useCallback, useState, useRef } from "react";
import Map, {
  Marker,
  NavigationControl,
  GeolocateControl,
  AttributionControl,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapMemory } from "@/types";
import type { PlaceResult } from "@/lib/geocode";
import MapSearch from "./MapSearch";
import { Heart } from "lucide-react";

/** OpenFreeMap + OpenStreetMap — free, rich POI & street labels (like Google Maps) */
const MAP_STYLES = {
  detailed: "https://tiles.openfreemap.org/styles/liberty",
  night: "https://tiles.openfreemap.org/styles/dark",
  satellite: "/map-styles/satellite-labeled.json",
} as const;

type MapStyleKey = keyof typeof MAP_STYLES;

interface MapViewProps {
  memories: MapMemory[];
  pickMode: boolean;
  onMapClick: (coords: { lat: number; lng: number }) => void;
  onMarkerClick: (memory: MapMemory) => void;
}

export default function MapView({ memories, pickMode, onMapClick, onMarkerClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("detailed");
  const [viewState, setViewState] = useState({
    longitude: 20,
    latitude: 30,
    zoom: 1.5,
    pitch: 0,
    bearing: 0,
  });

  const handleClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      if (pickMode) {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    },
    [onMapClick, pickMode]
  );

  const flyTo = useCallback((lng: number, lat: number, zoom: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1800 });
  }, []);

  const flyToMemory = useCallback(
    (memory: MapMemory) => {
      flyTo(memory.lng, memory.lat, 16);
    },
    [flyTo]
  );

  const handleSearchSelect = useCallback(
    (place: PlaceResult) => {
      const zoom = place.type === "city" ? 12 : place.type === "country" ? 6 : 16;
      flyTo(place.lng, place.lat, zoom);
    },
    [flyTo]
  );

  const styleButtons: { key: MapStyleKey; label: string }[] = [
    { key: "detailed", label: "Detailed" },
    { key: "night", label: "Night" },
    { key: "satellite", label: "Satellite" },
  ];

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border shadow-glow">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        onClick={handleClick}
        mapStyle={MAP_STYLES[mapStyle]}
        projection="globe"
        maxZoom={20}
        minZoom={1}
        style={{ width: "100%", height: "100%" }}
        cursor={pickMode ? "crosshair" : "grab"}
        attributionControl={false}
        dragRotate={true}
        touchZoomRotate={true}
        cooperativeGestures={false}
      >
        <NavigationControl position="bottom-left" showCompass showZoom visualizePitch />
        <GeolocateControl position="bottom-left" trackUserLocation showUserLocation />
        <AttributionControl compact position="bottom-right" />

        {memories.map((memory) => (
          <Marker
            key={memory.id}
            longitude={memory.lng}
            latitude={memory.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              flyToMemory(memory);
              onMarkerClick(memory);
            }}
          >
            <button
              className="group relative flex flex-col items-center transition-transform hover:scale-110 active:scale-95"
              aria-label={memory.title}
            >
              <div className="w-9 h-9 rounded-full bg-accent/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-accent/30 border-2 border-white/20 animate-marker-pulse">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="mt-1 px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-sm border border-border text-[10px] text-text font-medium max-w-[120px] truncate opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none">
                {memory.title}
              </div>
            </button>
          </Marker>
        ))}
      </Map>

      <MapSearch onSelect={handleSearchSelect} />

      <div className="absolute top-[3.75rem] md:top-14 left-3 flex gap-1 z-10 overflow-x-auto max-w-[calc(100%-1.5rem)] scrollbar-none">
        {styleButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMapStyle(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border transition-all shrink-0 ${
              mapStyle === key
                ? "bg-accent/20 text-accent border-accent/30"
                : "bg-surface/80 text-text-muted border-border hover:text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pickMode && (
        <>
          <div className="absolute inset-0 pointer-events-none z-[5] flex items-center justify-center">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-accent/80 -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-accent/80 -translate-x-1/2" />
              <div className="absolute inset-0 rounded-full border-2 border-accent/50" />
            </div>
          </div>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-accent/90 text-background text-xs font-medium backdrop-blur-sm shadow-lg animate-fade-in pointer-events-none whitespace-nowrap">
            Tap the exact spot to pin your memory
          </div>
        </>
      )}
    </div>
  );
}
