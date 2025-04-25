import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SupabaseProvider } from "@/contexts/supabase-provider"
import { GamesProvider } from "@/contexts/games-context"
import { GameDetailsProvider } from "@/contexts/game-details-context"
import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"
import FloatingChat from "@/components/floating-chat"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Draft Bet Assistant",
  description: "Make informed bets with data-driven insights",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <GameDetailsProvider>
              <GamesProvider>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <div className="flex flex-1">
                    <Sidebar />
                    <main className="flex-1 p-4 md:p-6">{children}</main>
                  </div>
                  <FloatingChat />
                </div>
              </GamesProvider>
            </GameDetailsProvider>
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
