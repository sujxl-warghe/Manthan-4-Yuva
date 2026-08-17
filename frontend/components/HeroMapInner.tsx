"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { api } from "@/lib/api";

interface Feature {
  geometry: { coordinates: [number, number] };
  properties: { id: string; tree_code: string; status: string; species: string | null };
}

const STATUS_COLOR: Record<string, string> = {
  HEALTHY: "#1f7a45",
  AT_RISK: "#d89b2b",
  VERIFICATION_DUE: "#e07a3f",
  DEAD: "#c94c4c",
  MISSING: "#c94c4c",
};

export default function HeroMapInner() {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    api
      .get<{ features: Feature[] }>("/api/v1/map/trees")
      .then((geo) => setFeatures(geo.features.slice(0, 150)))
      .catch(() => setFeatures([]));
  }, []);

  return (
    <MapContainer
      center={[21.1458, 79.0882]}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "420px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {features.map((f) => (
        <CircleMarker
          key={f.properties.id}
          center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
          radius={5}
          pathOptions={{
            color: STATUS_COLOR[f.properties.status] || "#66736b",
            fillColor: STATUS_COLOR[f.properties.status] || "#66736b",
            fillOpacity: 0.85,
            weight: 1,
          }}
        >
          <Popup>
            <div className="font-mono text-xs">{f.properties.tree_code}</div>
            <div className="text-sm font-medium">{f.properties.species}</div>
            <Link href={`/trees/${f.properties.tree_code}`} className="text-xs text-forest-700 underline">
              View Passport
            </Link>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
