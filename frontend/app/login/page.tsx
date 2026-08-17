"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Loader2 } from "lucide-react";
import { api, setToken, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vrukshasetu.demo");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: { role: string; name: string } }>(
        "/api/v1/auth/login",
        { email, password }
      );
      setToken(res.token);
      localStorage.setItem("vs_role", res.user.role);
      localStorage.setItem("vs_name", res.user.name);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-grain px-5">
      <div className="w-full max-w-sm rounded-2xl border border-forest-900/10 bg-white p-8 shadow-xl shadow-forest-900/5">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-cream">
            <Leaf size={18} />
          </span>
          <span className="font-display text-xl font-semibold text-forest-950">VrukshaSetu</span>
        </div>
        <h1 className="font-display text-2xl font-medium text-forest-950">Admin Portal</h1>
        <p className="mt-1 text-sm text-charcoal/50">Sign in to the authority command center.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal/60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-forest-900/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-charcoal/60">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-forest-900/15 px-3.5 py-2.5 text-sm outline-none focus:border-forest-700"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-900 py-2.5 text-sm font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="mt-5 rounded-lg bg-forest-900/[0.04] p-3 text-xs text-charcoal/50">
          Demo: <span className="font-mono">admin@vrukshasetu.demo</span> / <span className="font-mono">Admin@123</span>
        </div>
      </div>
    </div>
  );
}
