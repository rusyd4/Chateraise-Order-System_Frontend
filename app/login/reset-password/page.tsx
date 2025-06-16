"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordReset from "@/components/auth/PasswordReset";

export default function ResetPasswordPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 w-screen bg-center bg-no-repeat bg-cover opacity-150 dark:opacity-30 transition-opacity duration-500"
        style={{ backgroundImage: "url('/DSCF2264.jpg')", transform: "scale(1.2)", transformOrigin: "center" }}
      />
      <div className="absolute inset-0 bg-background/15 backdrop-blur-[2px]" />

      {/* Reset Password Card */}
      <Card className="relative max-w-md w-full mx-4 shadow-[0_5px_30px_rgba(109,0,0,0.3)] dark:shadow-[0_5px_30px_rgba(230,0,0,0.15)] border-primary/10 backdrop-blur-sm bg-card/90">
        <CardHeader className="space-y-2 items-center">
          <div className="w-full flex justify-center mb-2 transition transform hover:scale-105">
            <Image
              src="/Chateraiselogo.png"
              alt="Chateraise Logo"
              width={180}
              height={60}
              priority
              className="dark:brightness-[1.2] dark:contrast-[1.1]"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Reset Password</CardTitle>
          <CardDescription>Follow the steps below to reset your password</CardDescription>
        </CardHeader>

        <CardContent>
          <PasswordReset onClose={() => router.push("/login")} />
        </CardContent>
      </Card>
    </div>
  );
} 