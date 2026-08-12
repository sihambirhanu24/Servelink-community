"use client";

import { useEffect, useState } from "react";
import { getCategories } from "@/services/community.service";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function CategorySelect({
  value,
  onChange,
}: Props) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const cats = await getCategories();
        setCategories(Array.isArray(cats) ? cats : (cats?.data ?? []));
        setError(null);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load categories');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-[#043658] outline-none transition focus:border-[#043658] focus:bg-white focus:ring-4 focus:ring-[#043658]/10 disabled:opacity-60"
    >
      <option value="">{loading ? "Loading categories…" : "Select Category"}</option>

      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}

      {error && <option disabled>{error}</option>}
    </select>
  );
}