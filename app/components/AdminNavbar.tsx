"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Menu, Store } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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
      <nav className="hidden md:flex md:w-64 flex-col bg-gradient-to-r from-[#6d0000] to-[#961c1a] h-screen fixed left-0 shadow-lg">
        {/* Logo and Title at the very top */}
        <div className="p-6 flex flex-col items-center border-b border-white/10">
          <div className="w-140 h-12 rounded-full flex items-center justify-center mb-3">
            <Image
              src="/image-removebg-preview.png"
              alt="Store Logo"
              width={200}
              height={140}
              className="object-contain"
            />
          </div>
          <h2 className="text-white font-bold text-xl">Admin Portal</h2>
          <p className="text-white/70 text-xs">Order Management</p>
        </div>

        {/* Navigation items */}
        <div className="flex flex-col space-y-2 flex-grow p-4 overflow-y-auto">
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={`justify-start text-white hover:bg-white hover:text-[#6D0000] ${
                pathname === item.href ? "bg-[#ffffff] text-[#6D0000]" : ""
              }`}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        {/* Logout button */}
        <div className="p-4 border-t border-white/10">
          <Button
            onClick={() => setLogoutDialogOpen(true)}
            variant="destructive"
            className="cursor-pointer w-full"
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
                className="bg-[#6D0000] text-white border-[#6D0000]"
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
                onClick={() => setLogoutDialogOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile logo - centered */}
          <div className="w-140 h-8 rounded flex items-center justify-center">
            <Image
              src="/image-removebg-preview.png"
              alt="Store Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>

          {/* Spacer for balance */}
          <div className="w-10"></div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" className="cursor-pointer" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="cursor-pointer" onClick={() => { setLogoutDialogOpen(false); handleLogout(); }}>
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
