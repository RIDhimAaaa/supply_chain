import type React from "react"
import type { Metadata } from "next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "SupplyChain - Raw Materials Marketplace",
  description:
    "Connect with verified vendors for your raw materials. The most trusted marketplace for raw material suppliers and vendors.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sf">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
