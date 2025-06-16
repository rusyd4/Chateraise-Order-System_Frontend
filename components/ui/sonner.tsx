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
      className="toaster group"
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "black",
          "--normal-border": "black",
          "--success-bg": "white",
          "--success-text": "black",
          "--success-border": "green",
          "--error-bg": "white",
          "--error-text": "black",
          "--error-border": "red",
          "--toast-shadow": "var(--card-shadow)",
          "--font-family": "var(--font-geist-sans)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
