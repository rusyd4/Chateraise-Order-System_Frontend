"use client";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera, ShoppingCart, History, Upload, X } from "lucide-react";
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

  // Logout function placeholder
  function handleLogout() {
    // Implement logout logic here, e.g., clear auth tokens, redirect to login page
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
      active: false
    },
    {
      name: "Store",
      icon: ShoppingCart,
      action: goToStore,
      active: pathname === "/branch/store"
    },
    {
      name: "Order History",
      icon: History,
      action: goToOrderHistory,
      active: pathname === "/branch/order_history"
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
    reader.onload = function(event) {
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
    <nav className="bg-[#6D0000] text-primary-foreground px-4 py-3 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div 
          className="hover:opacity-90 transition-opacity"
        >
          <img 
            src="/image-removebg-preview.png" 
            alt="Logo" 
            className="h-10 md:h-12" 
          />
        </div>

        {/* Navigation Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant={item.active ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "gap-2",
                item.active ? "bg-background text-foreground" : "cursor-pointer hover:opacity-90"
              )}
              onClick={item.action}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.name}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-2 hover:opacity-90 text-destructive"
            onClick={handleLogout}
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Mobile Hamburger Menu Button and Dropdown */}
        <div className="sm:hidden flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-48">
              {navItems.map((item) => (
                <DropdownMenuItem
                  key={item.name}
                  className={cn(
                    item.active ? "bg-background text-foreground" : ""
                  )}
                  onClick={item.action}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleLogout}
              >
                <X className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpenState}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription>
              Scan a QR code to view order details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {scanError && (
              <Badge variant="destructive" className="w-full justify-center">
                {scanError}
              </Badge>
            )}
            
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              <div className="absolute inset-0 border-4 border-primary/50 rounded-lg pointer-events-none" />
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="relative w-full h-px bg-border">
                <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-background text-sm text-muted-foreground">
                  OR
                </span>
              </div>
              
              <label htmlFor="qr-upload" className="w-full">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="qr-upload"
                />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  asChild
                >
                  <div>
                    <Upload className="h-4 w-4" />
                    Upload QR Image
                  </div>
                </Button>
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}