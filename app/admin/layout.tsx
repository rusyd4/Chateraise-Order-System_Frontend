"use client";

import { ReactNode } from "react";
import AdminNavbar from "../components/AdminNavbar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
      <AdminNavbar />
      <main className="flex-1 p-4 md:p-6 pt-20 md:pt-6 md:ml-64">
        {children}
      </main>
    </div>
  );
}