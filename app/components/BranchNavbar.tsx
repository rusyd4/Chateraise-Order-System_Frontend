"use client";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Camera } from "lucide-react";
import QrScanner from "qr-scanner";

export default function BranchNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [orderHistoryHover, setOrderHistoryHover] = useState<boolean>(false);
  const [storeHover, setStoreHover] = useState<boolean>(false);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [cameraHover, setCameraHover] = useState<boolean>(false);
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
    <nav className="bg-[#6D0000] text-white p-4 flex items-center justify-between max-w-7xl mx-auto rounded-b-2xl">
      <div className="cursor-pointer" onClick={() => router.push("/")}>
        <img src="/image-removebg-preview.png" alt="Logo" className="h-12" />
      </div>
      <div className="flex space-x-4">
        <button
          className={
            "px-3 py-2 rounded transition-transform duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:ring-offset-2 " +
            (scannerOpen
              ? "bg-white text-[#6D0000] shadow-md scale-105"
              : "hover:bg-white hover:text-[#6D0000] hover:scale-105")
          }
          onClick={toggleScanner}
          onMouseEnter={() => setCameraHover(true)}
          onMouseLeave={() => setCameraHover(false)}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Scan QR</span>
            <Camera
              size={20}
              color={scannerOpen || cameraHover ? "#6D0000" : "white"}
            />
          </span>
        </button>
        <button
          className={
            "px-3 py-2 rounded transition-transform duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:ring-offset-2 " +
            (pathname === "/branch/store"
              ? "bg-white text-[#6D0000] shadow-md scale-105"
              : "hover:bg-white hover:text-[#6D0000] hover:scale-105")
          }
          onClick={goToStore}
          onMouseEnter={() => setStoreHover(true)}
          onMouseLeave={() => setStoreHover(false)}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Store</span>
            <img
              src={
                pathname === "/branch/store" || storeHover
                  ? "/Shopping_Bag_02_red.svg"
                  : "/Shopping_Bag_02_white.svg"
              }
              alt="Store Icon"
              className="h-5 w-5"
            />
          </span>
        </button>
        <button
          className={
            "px-3 py-2 rounded transition-transform duration-200 transform focus:outline-none focus:ring-2 focus:ring-[#6D0000] focus:ring-offset-2 " +
            (pathname === "/branch/order_history"
              ? "bg-white text-[#6D0000] shadow-md scale-105"
              : "hover:bg-white hover:text-[#6D0000] hover:scale-105")
          }
          onClick={goToOrderHistory}
          onMouseEnter={() => setOrderHistoryHover(true)}
          onMouseLeave={() => setOrderHistoryHover(false)}
        >
          <span className="inline-flex items-center space-x-2">
            <span>Order History</span>
            <img
              src={
                pathname === "/branch/order_history" || orderHistoryHover
                  ? "/OrderHistory_Red.svg"
                  : "/OrderHistory_White.svg"
              }
              alt="Order History Icon"
              className="h-5 w-5"
            />
          </span>
        </button>
      </div>

      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Scan QR Code
            </h3>
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
              <button
                onClick={() => {
                  setScannerOpen(false);
                  stopCamera();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
