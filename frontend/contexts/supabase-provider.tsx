"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { SupabaseClient, User } from "@supabase/supabase-js"

type SupabaseContextType = {
  supabase: SupabaseClient
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createBrowserClient())
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)

      // Create user profile if it doesn't exist
      if (session?.user) {
        try {
          const { data, error } = await supabase.from("user_profiles").select("id").eq("id", session.user.id).single()

          if (error || !data) {
            // Profile doesn't exist, create it
            await supabase.from("user_profiles").insert([
              {
                id: session.user.id,
                username: session.user.email?.split("@")[0] || `user_${Date.now()}`,
                full_name: session.user.user_metadata.full_name || "",
                avatar_url: session.user.user_metadata.avatar_url || "",
              },
            ])
          }
        } catch (error) {
          console.error("Error checking/creating user profile:", error)
        }
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      // Create user profile on sign up
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const { data, error } = await supabase.from("user_profiles").select("id").eq("id", session.user.id).single()

          if (error || !data) {
            // Profile doesn't exist, create it
            await supabase.from("user_profiles").insert([
              {
                id: session.user.id,
                username: session.user.email?.split("@")[0] || `user_${Date.now()}`,
                full_name: session.user.user_metadata.full_name || "",
                avatar_url: session.user.user_metadata.avatar_url || "",
              },
            ])
          }
        } catch (error) {
          console.error("Error creating user profile:", error)
        }
      }

      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return (
    <SupabaseContext.Provider value={{ supabase, user, loading, refreshUser }}>{children}</SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider")
  }
  return context
}
