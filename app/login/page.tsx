"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import apiFetch from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    console.log("handleSubmit triggered");
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Save token and user info in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("full_name", data.full_name);

      // Redirect based on role
      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "branch_store") {
        router.push("/branch/store");
      } else {
        setError("Unknown user role");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-contain"
        style={{ backgroundImage: "url('/DSCF2264.jpg')", backgroundSize: "120%" }}
      />
      <div className="absolute inset-0 bg-gray-200 opacity-20" />
      <div className="relative max-w-md w-full bg-[var(--card)] p-8 rounded-xl shadow-[0_1px_30px_rgba(109,0,0,0.3)]">
        <div className="flex justify-center mb-6 transition transform hover:scale-105 cursor-pointer">
          <Image
            src="/Chateraiselogo.png"
            alt="Chateraise Logo"
            width={200}
            height={70}
            priority
          />
        </div>
        <h1 className="text-2xl font-bold mb-3 text-center text-[var(--primary)]">Login</h1>
        {error && (
          <div className="mb-4 text-[var(--destructive)] text-center font-semibold">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-1 font-medium text-[var(--foreground)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--border)] rounded px-3 py-2 cursor-pointer hover:border-[#6D0000] hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:shadow-md transition duration-300 ease-in-out"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 font-medium text-[var(--foreground)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--border)] rounded px-3 py-2 cursor-pointer hover:border-[#6D0000] hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:shadow-md transition duration-300 ease-in-out"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6D0000] text-[var(--primary-foreground)] py-2 rounded transition transform hover:scale-105 hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}
