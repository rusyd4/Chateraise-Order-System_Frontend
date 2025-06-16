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
import { Menu, Store, ShoppingCart, Package, Building2, BarChart3, LogOut, ChevronRight } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Orders", icon: ShoppingCart, description: "Manage all orders" },
    { href: "/admin/food", label: "Manage Products", icon: Package, description: "Product management" },
    { href: "/admin/branch", label: "Manage Branch Stores", icon: Building2, description: "Branch locations" },
    { href: "/admin/recap", label: "Recap", icon: BarChart3, description: "Reports & analytics" },
  ];

  return (
    <>
      {/* Desktop Navigation - shown on md screens and up */}
      <nav className="hidden md:flex md:w-64 flex-col bg-gradient-to-b from-[#6d0000] via-[#7a1a1a] to-[#6d0000] h-screen fixed left-0 shadow-2xl z-40 border-r border-white/10">
        {/* Logo and Title section */}
        <div className="p-6 flex flex-col items-center border-b border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="w-full h-16 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 transition-all duration-300 hover:bg-white/15">
            <Image
              src="/image-removebg-preview.png"
              alt="Store Logo"
              width={180}
              height={120}
              className="object-contain filter drop-shadow-lg"
              priority
            />
          </div>
          <h2 className="text-white font-bold text-xl tracking-wide">Admin Portal</h2>
          <p className="text-white/80 text-sm font-medium">Order Management System</p>
        </div>

        {/* Navigation items */}
        <div className="flex flex-col space-y-2 flex-grow p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="group relative"
              >
                <Button
                  variant="ghost"
                  className={`
                    cursor-pointer w-full hover:bg-white/20 justify-start p-4 h-auto text-left rounded-xl transition-all duration-300 group-hover:shadow-lg
                    ${isActive 
                      ? "bg-white/15 text-white shadow-lg backdrop-blur-sm border border-white/20" 
                      : "text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`
                      p-2 rounded-lg transition-all duration-300
                      ${isActive 
                        ? "bg-white/20 shadow-sm" 
                        : "bg-white/10 group-hover:bg-white/15"
                      }
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-white/70 mt-0.5">{item.description}</div>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 opacity-70" />
                    )}
                  </div>
                </Button>
                {isActive && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full shadow-lg"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout button */}
        <div className="p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
          <Button
            onClick={() => setLogoutDialogOpen(true)}
            variant="outline"
            className="cursor-pointer w-full bg-red-600/20 text-white border-red-400/50 hover:bg-red-600/30 hover:border-red-400/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 w-full bg-gradient-to-r from-[#6d0000] to-[#8b1538] border-b border-white/10 z-50 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 ml-2 bg-[#6d0000]/95 text-white border-white/20 backdrop-blur-lg shadow-2xl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className={`
                      p-3 cursor-pointer transition-all duration-200
                      ${isActive 
                        ? "bg-white/15 text-white" 
                        : "hover:bg-white/10 focus:bg-white/10"
                      }
                    `}
                  >
                    <Link href={item.href} className="w-full flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-white/70">{item.description}</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuItem
                onClick={() => setLogoutDialogOpen(true)}
                className="p-3 text-red-300 hover:text-red-200 focus:text-red-200 hover:bg-red-600/20 focus:bg-red-600/20 cursor-pointer transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile logo - centered */}
          <div className="flex-1 flex justify-center">
            <div className="h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center px-4">
              <Image
                src="/image-removebg-preview.png"
                alt="Store Logo"
                width={100}
                height={80}
                className="object-contain filter drop-shadow-md"
                priority
              />
            </div>
          </div>

          {/* Spacer for balance */}
          <div className="w-10"></div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Confirm Logout</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to logout? You&apos;ll need to sign in again to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center space-x-3 mt-6">
            <Button 
              variant="outline" 
              className="px-6 transition-all duration-200 hover:shadow-md" 
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="px-6 transition-all duration-200 hover:shadow-md" 
              onClick={() => { setLogoutDialogOpen(false); handleLogout(); }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
