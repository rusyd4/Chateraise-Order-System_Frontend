"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TestTube } from "lucide-react";
import apiFetch from "@/lib/api";
import { toast } from "sonner";

export default function UnauthorizedTest() {
  const [isTestingAuth, setIsTestingAuth] = useState(false);

  const testUnauthorizedEndpoint = async () => {
    setIsTestingAuth(true);
    try {
      const originalToken = localStorage.getItem("token");
      localStorage.removeItem("token");
      
      await apiFetch("/admin/branches");
      
      if (originalToken) {
        localStorage.setItem("token", originalToken);
      }
      
      toast.success("Endpoint berhasil diakses (tidak diharapkan)");
    } catch (error) {
      console.log("Expected unauthorized error:", error);
    } finally {
      setIsTestingAuth(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Test Unauthorized Handling</CardTitle>
        </div>
        <CardDescription>
          Gunakan tombol ini untuk menguji error authorization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800">Peringatan Testing</p>
            <p className="text-yellow-700 mt-1">
              Testing ini akan memicu modal unauthorized dan mengarahkan ke login.
            </p>
          </div>
        </div>

        <Button
          onClick={testUnauthorizedEndpoint}
          disabled={isTestingAuth}
          variant="outline"
          className="w-full"
        >
          {isTestingAuth ? "Testing..." : "Test Unauthorized Error"}
        </Button>
      </CardContent>
    </Card>
  );
} 