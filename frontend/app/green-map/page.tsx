"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "@/lib/api";

const GreenMapInner = dynamic(() => import("@/components/GreenMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="font-mono text-xs text-forest-700">Loading map…</span>
    </div>
  ),
});

interface Option { id: string; name: string }

const STATUSES = [
  { value: "HEALTHY", label: "Healthy" },
  { value: "AT_RISK", label: "At Risk" },
  { value: "VERIFICATION_DUE", label: "Verification Due" },
  { value: "DEAD", label: "Dead / Missing" },
];

export default function GreenMapPage() {
  const router = useRouter();
  const [wards, setWards] = useState<Option[]>([]);
  const [species, setSpecies] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [filters, setFilters] = useState({ ward: "", species: "", category: "", status: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<Option[]>("/api/v1/wards").then((d) => setWards(d.map((w) => ({ id: (w as any).id, name: (w as any).name }))));
    api.get<Option[]>("/api/v1/species").then(setSpecies);
    api.get<Option[]>("/api/v1/categories").then(setCategories);
  }, []);

  const set = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-forest-700">Live Map</span>
          <h1 className="mt-1 font-display text-3xl font-medium text-forest-950 sm:text-4xl">
            Nagpur Green Map
          </h1>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (search.trim()) router.push(`/trees/${search.trim()}`);
          }}
          className="flex items-center gap-2 rounded-full border border-forest-900/15 bg-white px-4 py-2.5"
        >
          <Search size={16} className="text-forest-700" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Tree ID e.g. NGP-2026-000421"
            className="w-64 bg-transparent text-sm outline-none placeholder:text-charcoal/40"
          />
        </form>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <Select label="Ward" value={filters.ward} onChange={(v) => set("ward", v)} options={wards} />
        <Select label="Species" value={filters.species} onChange={(v) => set("species", v)} options={species} />
        <Select label="Category" value={filters.category} onChange={(v) => set("category", v)} options={categories} />
        <Select
          label="Status"
          value={filters.status}
          onChange={(v) => set("status", v)}
          options={STATUSES.map((s) => ({ id: s.value, name: s.label }))}
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-4 rounded-xl border border-forest-900/10 bg-white px-5 py-3 text-xs">
        <Legend color="#1f7a45" label="Healthy" />
        <Legend color="#d89b2b" label="At Risk" />
        <Legend color="#e07a3f" label="Verification Due" />
        <Legend color="#c94c4c" label="Dead / Missing" />
      </div>

      <div className="h-[600px] overflow-hidden rounded-2xl border border-forest-900/10 shadow-lg shadow-forest-900/5">
        <GreenMapInner filters={filters} />
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: Option[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-forest-900/15 bg-white px-4 py-2 text-sm text-charcoal/80 outline-none focus:border-forest-700"
    >
      <option value="">{label}: All</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </select>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-charcoal/70">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
