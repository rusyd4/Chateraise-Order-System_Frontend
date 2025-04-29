"use client";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera, ShoppingCart, History } from "lucide-react";
import QrScanner from "qr-scanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function BranchNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null); // Reference for qr-scanner

  function goToStore() {
    router.push("/branch/store");
  }

  function goToOrderHistory() {
    router.push("/branch/order_history");
  }

  function toggleScanner() {
    if (scannerOpen) {
      stopCamera();
      setScannerOpen(false);
    } else {
      setScannerOpen(true);
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const result = event.target?.result;
      if (!result) return;
      // Manually decode the QR code using qr-scanner
      QrScanner.scanImage(result as string).then(result => {
        if (result) {
          const orderId = result;
          router.push(`/branch/orders/${orderId}`);
          setScannerOpen(false);
          stopCamera();
        }
      }).catch(error => {
        console.error("QR Code scanning error:", error);
      });
    };
    reader.readAsDataURL(file);
  }

  // Start camera when scannerOpen is true
  useEffect(() => {
    if (scannerOpen) {
      async function startCamera() {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();

            // Initialize QR scanner with video element
            qrScannerRef.current = new QrScanner(videoRef.current, (result) => {
              if (result) {
                const orderId = result;
                router.push(`/branch/orders/${orderId}`);
                setScannerOpen(false);
                stopCamera();
              }
            });

            qrScannerRef.current.start();
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
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

    // Cleanup on unmount
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current = null;
      }
      stopCamera();
    };
  }, [scannerOpen]);

  return (
    <nav className="bg-[#6D0000] text-white p-4 flex items-center justify-between mx-auto">
      <div className="cursor-pointer" onClick={() => router.push("/")}>
        <img src="/image-removebg-preview.png" alt="Logo" className="h-12" />
      </div>
      <div className="flex space-x-4">
        <Button
          onClick={toggleScanner}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Scan QR</span>
            <Camera
              size={20}
            />
          </span>
        </Button>
        <Button
          onClick={goToStore}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Store</span>
            <ShoppingCart
              size={20}
            />
          </span>
        </Button>
        <Button
          onClick={goToOrderHistory}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Order History</span>
            <History
              size={20}
            />
          </span>
        </Button>
      </div>

      <Dialog open={scannerOpen} onOpenChange={toggleScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <video
                ref={videoRef}
                className="w-full rounded"
                muted
                playsInline
              />
              <div className="text-center">
                <p className="text-gray-600 mb-2">Or</p>
                <label className="px-4 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer hover:bg-gray-300 transition-colors">
                  Upload QR Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={toggleScanner} variant="secondary">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
