import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schemas
const requestOTPSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const verifyOTPSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be 6 digits." }),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RequestOTPFormValues = z.infer<typeof requestOTPSchema>;
type VerifyOTPFormValues = z.infer<typeof verifyOTPSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function PasswordReset({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize forms
  const requestForm = useForm<RequestOTPFormValues>({
    resolver: zodResolver(requestOTPSchema),
    defaultValues: { email: "" },
  });

  const verifyForm = useForm<VerifyOTPFormValues>({
    resolver: zodResolver(verifyOTPSchema),
    defaultValues: { otp: "" },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleRequestOTP = async (data: RequestOTPFormValues) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/request-reset", {
        method: "POST",
        body: JSON.stringify({ email: data.email }),
      });
      setEmail(data.email);
      setStep('verify');
      toast.success("OTP sent successfully", {
        description: "Please check your email for the OTP code.",
      });
    } catch (error) {
      toast.error("Failed to send OTP", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: VerifyOTPFormValues) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: data.otp }),
      });
      setOtp(data.otp);
      setStep('reset');
    } catch (error) {
      toast.error("Invalid OTP", {
        description: "Please check the code and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          newPassword: data.newPassword,
        }),
      });
      toast.success("Password reset successful", {
        description: "You can now log in with your new password.",
      });
      onClose();
    } catch (error) {
      toast.error("Failed to reset password", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === 'request' && (
        <Form {...requestForm}>
          <form onSubmit={requestForm.handleSubmit(handleRequestOTP)} className="space-y-4">
            <FormField
              control={requestForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      className="bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#6D0000] hover:bg-[#8A0000]"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 'verify' && (
        <Form {...verifyForm}>
          <form onSubmit={verifyForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
            <FormField
              control={verifyForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter OTP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('request')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#6D0000] hover:bg-[#8A0000]"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 'reset' && (
        <Form {...resetForm}>
          <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className="pr-10 bg-background/50"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('verify')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#6D0000] hover:bg-[#8A0000]"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
} 