"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Store } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Orders" },
    { href: "/admin/food", label: "Manage Products" },
    { href: "/admin/branch", label: "Manage Branch Stores" },
    { href: "/admin/recap", label: "Recap" },
  ];

  return (
    <>
      {/* Desktop Navigation - shown on md screens and up */}
      <nav className="hidden md:flex md:w-64 flex-col bg-[#6D0000] h-screen fixed left-0 shadow-lg">
        {/* Logo and Title at the very top */}
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3">
            <Store className="h-8 w-8 text-[#6D0000]" />
          </div>
          <h2 className="text-white font-bold text-xl">Admin Portal</h2>
          <p className="text-white/70 text-xs">Store Management</p>
        </div>

        {/* Navigation items */}
        <div className="flex flex-col space-y-2 flex-grow p-4 overflow-y-auto">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={`justify-start text-white hover:bg-[#800000] hover:text-white ${
                pathname === item.href ? "bg-[#800000]" : ""
              }`}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        {/* Logout button */}
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 w-full bg-[#6D0000] border-b border-white/10 z-50">
        <div className="flex items-center justify-between p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-white border-white/30"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 ml-2 bg-[#6D0000] text-white border-white/10">
              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  className={`${pathname === item.href ? "bg-[#800000]" : ""}`}
                >
                  <Link href={item.href} className="w-full">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile logo - centered */}
          <div className="w-16 h-8 bg-white rounded flex items-center justify-center">
            <Store className="h-6 w-6 text-[#6D0000]" />
          </div>

          {/* Spacer for balance */}
          <div className="w-10"></div>
        </div>
      </div>
    </>
  );
}
