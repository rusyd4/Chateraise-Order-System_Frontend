"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  // Debug log for theme value
  console.log("Toaster theme value:", theme)

  // Ensure theme is a string and valid ToasterProps["theme"], fallback to "system"
  const validThemes = ["light", "dark", "system"]
  const safeTheme =
    typeof theme === "string" && validThemes.includes(theme) ? theme : "system"

  return (
    <Sonner
      theme={safeTheme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--primary)",
          "--success-text": "var(--primary-foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--destructive)",
          "--error-text": "var(--primary-foreground)",
          "--error-border": "var(--border)",
          "--toast-shadow": "var(--card-shadow)",
          "--font-family": "var(--font-geist-sans)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
