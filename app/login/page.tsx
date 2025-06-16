"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "../../lib/api";

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = "Email is required.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      // Save token and user info in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.role);
      localStorage.setItem("full_name", response.full_name);

      // Redirect based on role with slight delay for toast visibility
      setTimeout(() => {
        if (response.role === "admin") {
          router.push("/admin/dashboard");
        } else if (response.role === "branch_store") {
          router.push("/branch/store");
        } else {
          toast.error("Unknown user role", {
            description: "Please contact an administrator.",
          });
        }
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error("Login failed", {
          description: err.message || "Please check your credentials and try again."
        });
      } else {
        toast.error("Login failed", {
          description: "An unexpected error occurred. Please try again."
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 w-screen bg-center bg-no-repeat bg-cover opacity-150 dark:opacity-30 transition-opacity duration-500"
        style={{ backgroundImage: "url('/DSCF2264.jpg')", transform: "scale(1.2)", transformOrigin: "center" }}
      />
      <div className="absolute inset-0 bg-background/15 backdrop-blur-[2px]" />

      {/* Login Card */}
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
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="Enter your email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-background/50 hover:shadow-lg hover:-translate-y-0.5 focus:outline focus:outline-2 focus:outline-[#6D0000] transition-all duration-300 ease-in-out"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pr-10 bg-background/50 hover:shadow-lg hover:-translate-y-0.5 focus:outline focus:outline-2 focus:outline-[#6D0000] transition-all duration-300 ease-in-out"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full bg-[#6D0000] hover:bg-[#8A0000] hover:shadow-lg hover:-translate-y-0.5 text-white font-medium transition-all duration-300 ease-in-out"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
              
              <div className="text-center">
                <Link href="/login/reset-password" className="text-sm text-muted-foreground hover:text-primary">
                  Forgot password?
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
