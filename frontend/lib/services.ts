import { createBrowserClient } from "./supabase"
import type { User } from "@supabase/supabase-js"

// User profile services
export const getUserProfile = async (userId: string) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

  if (error) throw error
  return data
}

export const createUserProfile = async (user: User) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("user_profiles").insert([
    {
      id: user.id,
      username: user.email?.split("@")[0] || `user_${Date.now()}`,
      full_name: user.user_metadata.full_name || "",
      avatar_url: user.user_metadata.avatar_url || "",
    },
  ])

  if (error) throw error
  return data
}

export const updateUserProfile = async (userId: string, updates: any) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId)

  if (error) throw error
  return data
}

// Chat message services
export const getChatMessages = async (userId: string) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return data
}

export const saveChatMessage = async (userId: string, role: string, content: string) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("chat_messages").insert([
    {
      user_id: userId,
      role,
      content,
    },
  ])

  if (error) throw error
  return data
}

// Betting services
export const getUserBets = async (userId: string) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("user_bets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const placeBet = async (
  userId: string,
  gameId: string,
  playerId: string | null,
  betType: string,
  description: string,
  amount: number,
  odds: string,
  potentialPayout: number,
) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("user_bets").insert([
    {
      user_id: userId,
      game_id: gameId,
      player_id: playerId,
      bet_type: betType,
      description,
      amount,
      odds,
      potential_payout: potentialPayout,
    },
  ])

  if (error) throw error
  return data
}

// Simulation services
export const getUserSimulations = async (userId: string) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from("user_simulations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const saveSimulation = async (
  userId: string,
  name: string,
  description: string,
  parameters: any,
  results: any,
) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("user_simulations").insert([
    {
      user_id: userId,
      name,
      description,
      parameters,
      results,
    },
  ])

  if (error) throw error
  return data
}

export const updateSimulation = async (simulationId: string, updates: any) => {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.from("user_simulations").update(updates).eq("id", simulationId)

  if (error) throw error
  return data
}
