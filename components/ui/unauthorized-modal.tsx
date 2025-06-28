"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogIn } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";

interface UnauthorizedModalProps {
  isOpen: boolean;
  onClose?: () => void;
  message?: string;
}

export default function UnauthorizedModal({ 
  isOpen, 
  onClose, 
  message = "Sesi Anda telah berakhir atau Anda tidak memiliki akses ke halaman ini." 
}: UnauthorizedModalProps) {
  const router = useRouter();

  const handleLoginRedirect = () => {
    // Clear any stored tokens
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("full_name");
    }
    
    // Close modal if onClose is provided
    if (onClose) {
      onClose();
    }
    
    // Redirect to login
    router.push("/login");
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                Akses Tidak Diizinkan
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-base leading-6">
          {message}
        </AlertDialogDescription>
        
        <AlertDialogFooter className="gap-3">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Tutup
            </Button>
          )}
          <AlertDialogAction asChild>
            <Button
              onClick={handleLoginRedirect}
              className="flex-1 bg-[#6D0000] hover:bg-[#8A0000]"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Ke Halaman Login
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 