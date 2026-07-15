export interface PlaceResult {
  lat: number;
  lng: number;
  name: string;
  type: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: { lat: string; lon: string; display_name: string; type: string; class: string }) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name,
      type: item.type || item.class || "place",
    }));
  } catch {
    return [];
  }
}
