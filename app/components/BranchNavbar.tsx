"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, History, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function BranchNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Logout function placeholder
  function handleLogout() {
    // First clear all localStorage items
    localStorage.clear();
    
    // Force a page refresh instead of using router
    window.location.href = '/login';
  }

  function goToStore() {
    router.push("/branch/store");
  }

  function goToOrderHistory() {
    router.push("/branch/order_history");
  }

  const navItems = [
    {
      name: "Store",
      icon: ShoppingCart,
      action: goToStore,
      active: pathname === "/branch/store",
      description: "Browse products"
    },
    {
      name: "Order History",
      icon: History,
      action: goToOrderHistory,
      active: pathname === "/branch/order_history",
      description: "View past orders"
    }
  ];

  return (
    <>
      {/* Enhanced Navigation Bar */}
      <nav className="bg-gradient-to-r from-[#a52422] to-[#6D0000] text-white px-4 py-4 shadow-2xl sticky top-0 z-50 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-12 md:h-14 rounded-lg flex items-center justify-center px-3 transition-all duration-300 hover:bg-white/15 hover:shadow-lg">
                <Image
                  src="/image-removebg-preview.png"
                  alt="Store Logo"
                  width={48}
                  height={48}
                  className="h-10 md:h-12 object-contain filter drop-shadow-md"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold tracking-wide">Branch Dashboard</h1>
                <p className="text-xs text-white/80 font-medium">Order Management</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    onClick={item.action}
                    variant="ghost"
                    className={cn(
                      "cursor-pointer h-12 px-4 rounded-xl transition-all duration-300 group",
                      item.active
                        ? "bg-white/15 text-white shadow-lg backdrop-blur-sm border border-white/20 hover:bg-white/20"
                        : "text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        item.active 
                          ? "bg-white/20 shadow-sm" 
                          : "bg-white/5 group-hover:bg-white/15"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-white/70">{item.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
              
              {/* Logout Button */}
              <Button
                onClick={() => setLogoutDialogOpen(true)}
                variant="outline"
                className="cursor-pointer h-12 px-4 bg-red-600/20 text-white border-red-400/50 hover:bg-red-600/30 hover:border-red-400/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="font-medium">Logout</span>
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm rounded-xl"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mr-4 bg-[#6d0000]/95 text-white border-white/20 backdrop-blur-lg shadow-2xl rounded-xl">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.name}
                        onClick={item.action}
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-200 rounded-lg mx-2 my-1",
                          item.active 
                            ? "bg-white/15 text-white" 
                            : "hover:bg-white/10 focus:bg-white/10"
                        )}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <div className={cn(
                            "p-2 rounded-lg transition-all duration-300",
                            item.active 
                              ? "bg-white/20" 
                              : "bg-white/10"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-white/70">{item.description}</div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  <div className="mx-2 my-2 pt-2 border-t border-white/20">
                    <DropdownMenuItem
                      onClick={() => setLogoutDialogOpen(true)}
                      className="p-4 text-red-300 hover:text-red-200 focus:text-red-200 hover:bg-red-600/20 focus:bg-red-600/20 cursor-pointer transition-all duration-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-red-600/20">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Logout</div>
                          <div className="text-xs text-red-300/70">Sign out of account</div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold">Confirm Logout</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Are you sure you want to logout? You&apos;ll need to sign in again to access the branch portal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center space-x-3 mt-6">
            <Button 
              variant="outline" 
              className="cursor-pointer px-6 transition-all duration-200 hover:shadow-md" 
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="cursor-pointer px-6 transition-all duration-200 hover:shadow-md" 
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