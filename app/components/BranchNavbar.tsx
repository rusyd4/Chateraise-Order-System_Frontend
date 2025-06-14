"use client";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera, ShoppingCart, History, Upload, X, LogOut, Menu } from "lucide-react";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  // Tooltip,
  // TooltipTrigger,
  // TooltipContent
} from "@/components/ui/tooltip";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BranchNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Logout function placeholder
  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  function goToStore() {
    router.push("/branch/store");
  }

  function goToOrderHistory() {
    router.push("/branch/order_history");
  }

  function toggleScanner() {
    setScannerOpen(!scannerOpen);
    setScanError(null);
  }

  function setScannerOpenState(open: boolean) {
    setScannerOpen(open);
    setScanError(null);
  }

  const navItems = [
    {
      name: "Scan QR",
      icon: Camera,
      action: toggleScanner,
      active: false,
      description: "Scan order QR codes"
    },
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

  // New state for mobile menu open/close
  // Removed mobileMenuOpen state as DropdownMenu manages open state internally

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);

    const reader = new FileReader();
    reader.onload = function (event) {
      const result = event.target?.result;
      if (!result) return;

      QrScanner.scanImage(result as string, {
        returnDetailedScanResult: true
      })
        .then(result => {
          if (result?.data) {
            const orderId = result.data;
            router.push(`/branch/orders/${orderId}`);
            setScannerOpen(false);
            stopCamera();
          }
        })
        .catch(error => {
          console.error("QR Code scanning error:", error);
          setScanError("Failed to scan QR code. Please try another image.");
        });
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (scannerOpen) {
      async function startCamera() {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
          });
          setStream(mediaStream);

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();

            qrScannerRef.current = new QrScanner(
              videoRef.current,
              (result) => {
                if (result?.data) {
                  const orderId = result.data;
                  router.push(`/branch/orders/${orderId}`);
                  setScannerOpen(false);
                  stopCamera();
                }
              },
              {
                preferredCamera: 'environment',
                highlightScanRegion: true,
                highlightCodeOutline: true,
              }
            );

            qrScannerRef.current.start();
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          setScanError("Could not access camera. Please check permissions.");
        }
      }
      startCamera();
    } else {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
      stopCamera();
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
      stopCamera();
    };
  }, [scannerOpen]);

  return (
    <>
      {/* Enhanced Navigation Bar */}
      <nav className="bg-gradient-to-r from-[#6d0000] via-[#8b1538] to-[#6d0000] text-white px-4 py-4 shadow-2xl sticky top-0 z-50 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-3">
              <div className="h-12 md:h-14 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center px-3 transition-all duration-300 hover:bg-white/15 hover:shadow-lg">
                <img
                  src="/image-removebg-preview.png"
                  alt="Store Logo"
                  className="h-10 md:h-12 object-contain filter drop-shadow-md"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold tracking-wide">Branch Portal</h1>
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
                      "h-12 px-4 rounded-xl transition-all duration-300 group",
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
                className="h-12 px-4 bg-red-600/20 text-white border-red-400/50 hover:bg-red-600/30 hover:border-red-400/70 transition-all duration-300 hover:shadow-lg backdrop-blur-sm rounded-xl"
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

      {/* Enhanced QR Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpenState}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-center text-xl font-semibold">Scan QR Code</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Point your camera at the QR code or upload an image to scan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {scanError && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                  <div className="text-center text-white">
                    <X className="h-8 w-8 mx-auto mb-2 text-red-400" />
                    <p className="text-sm">{scanError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload Option */}
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
                id="qr-upload"
              />
              <label
                htmlFor="qr-upload"
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100"
              >
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    Upload QR Code Image
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to select an image file
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setScannerOpen(false)}
              variant="outline"
              className="px-8 transition-all duration-200 hover:shadow-md"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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