"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { api } from "@/lib/api";

interface Feature {
  geometry: { coordinates: [number, number] };
  properties: {
    id: string; tree_code: string; status: string; species: string | null;
    category: string | null; ward: string | null; plantation_date: string;
  };
}

const STATUS_COLOR: Record<string, string> = {
  HEALTHY: "#1f7a45",
  AT_RISK: "#d89b2b",
  VERIFICATION_DUE: "#e07a3f",
  DEAD: "#c94c4c",
  MISSING: "#c94c4c",
};

function Recenter({ features }: { features: Feature[] }) {
  const map = useMap();
  useEffect(() => {
    if (features.length === 0) return;
    // no-op recenter kept simple/subtle for prototype
  }, [features, map]);
  return null;
}

export default function GreenMapInner({ filters }: { filters: Record<string, string> }) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    api
      .get<{ features: Feature[] }>(`/api/v1/map/trees?${params.toString()}`)
      .then((geo) => setFeatures(geo.features))
      .catch(() => setFeatures([]))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute right-4 top-4 z-[1000] rounded-full bg-white px-3 py-1.5 font-mono text-xs text-forest-700 shadow">
          Loading trees…
        </div>
      )}
      <MapContainer center={[21.1458, 79.0882]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter features={features} />
        {features.map((f) => (
          <CircleMarker
            key={f.properties.id}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={6}
            pathOptions={{
              color: STATUS_COLOR[f.properties.status] || "#66736b",
              fillColor: STATUS_COLOR[f.properties.status] || "#66736b",
              fillOpacity: 0.85,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="font-mono text-xs text-forest-700">{f.properties.tree_code}</div>
              <div className="text-sm font-semibold">{f.properties.species}</div>
              <div className="text-xs text-charcoal/60">
                {f.properties.category} • {f.properties.ward}
              </div>
              <Link
                href={`/trees/${f.properties.tree_code}`}
                className="mt-1 inline-block text-xs font-medium text-forest-700 underline"
              >
                Open Tree Passport →
              </Link>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
