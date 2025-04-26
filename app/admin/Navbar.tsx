"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="w-48 flex flex-col space-y-4 border-r border-gray-300 pr-4">
      <div className="mb-4">
        <img
          src="/Chateraiselogo.png"
          alt="Chateraise Logo"
          width={200}
          height={70}
          className="object-contain"
        />
      </div>
      <Link
        href="/admin/dashboard"
        className={
          "px-3 py-2 rounded transition transform " +
          (pathname === "/admin/dashboard"
            ? "bg-[#6D0000] text-white"
            : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
        }
      >
        Orders
      </Link>
      <Link
        href="/admin/food"
        className={
          "px-3 py-2 rounded transition transform " +
          (pathname === "/admin/food"
            ? "bg-[#6D0000] text-white"
            : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
        }
      >
        Manage Products
      </Link>
      <Link
        href="/admin/branch"
        className={
          "px-3 py-2 rounded transition transform " +
          (pathname === "/admin/branch"
            ? "bg-[#6D0000] text-white"
            : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
        }
      >
        Manage Branch Stores
      </Link>
      <Link
        href="/admin/recap"
        className={
          "px-3 py-2 rounded transition transform " +
          (pathname === "/admin/recap"
            ? "bg-[#6D0000] text-white"
            : "hover:bg-[#7a0000] hover:text-white hover:scale-105")
        }
      >
        Recap
      </Link>
    </nav>
  );
}
