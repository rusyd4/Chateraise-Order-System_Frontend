"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Toaster } from "sonner";
import { toast } from "sonner";
import apiFetch from "../../lib/api";

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define form schema with validation
const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      // Save token and user info in localStorage
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.role);
      localStorage.setItem("full_name", response.full_name);

      // Show success toast
      toast.success("Login successful!", {
        description: `Welcome back, ${response.full_name}!`,
      });

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
        className="absolute inset-0 bg-center bg-no-repeat bg-cover opacity-70 dark:opacity-30 transition-opacity duration-500"
        style={{ backgroundImage: "url('/DSCF2264.jpg')", backgroundSize: "120%" }}
      />
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px]" />

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your.email@example.com" 
                        type="email" 
                        autoComplete="email"
                        className="bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="••••••••" 
                          type={showPassword ? "text" : "password"} 
                          autoComplete="current-password"
                          className="pr-10 bg-background/50"
                          {...field}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-[#6D0000] hover:bg-[#8A0000] text-white font-medium transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Need help? <a href="#" className="text-primary hover:underline">Contact support</a>
          </p>
        </CardFooter>
      </Card>
      
    </div>
  );
}
