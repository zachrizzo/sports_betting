"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { gamesApi } from "@/lib/api";

// Define the game interface
export interface Game {
  event_id: string;
  name: string;
  start: string;
  away_team: string;
  home_team: string;
  away_team_abbreviation?: string;
  home_team_abbreviation?: string;
  competition_name?: string;
}

// Define the context interface
interface GamesContextType {
  games: Game[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchGames: (forceRefresh?: boolean) => Promise<void>;
}

// Create context with default values
const GamesContext = createContext<GamesContextType>({
  games: [],
  loading: false,
  error: null,
  lastFetched: null,
  fetchGames: async () => {},
});

// Cache expiration time - 5 minutes
const CACHE_EXPIRATION = 5 * 60 * 1000; 

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Load cached data from localStorage on initial mount
  useEffect(() => {
    const cachedData = localStorage.getItem("gamesData");
    const cachedTimestamp = localStorage.getItem("gamesLastFetched");
    
    if (cachedData && cachedTimestamp) {
      try {
        const parsedData = JSON.parse(cachedData);
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        
        // If cache is still valid (less than 5 minutes old)
        if (now - timestamp < CACHE_EXPIRATION) {
          console.log("Using cached games data");
          setGames(parsedData);
          setLastFetched(timestamp);
        } else {
          console.log("Cached data expired, will fetch fresh data");
          // We'll fetch fresh data when component mounts
        }
      } catch (err) {
        console.error("Error parsing cached games data:", err);
        // We'll fetch fresh data when component mounts
      }
    }
  }, []);

  // Function to fetch games data
  const fetchGames = async (forceRefresh = false) => {
    // Skip fetch if we have data and it's not expired, unless force refresh
    if (
      !forceRefresh &&
      games.length > 0 &&
      lastFetched && 
      Date.now() - lastFetched < CACHE_EXPIRATION
    ) {
      console.log("Using existing games data, still fresh");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching fresh games data from API");
      const data = await gamesApi.getUpcomingGames();
      
      setGames(data);
      setError(null);
      
      const timestamp = Date.now();
      setLastFetched(timestamp);
      
      // Cache in localStorage
      localStorage.setItem("gamesData", JSON.stringify(data));
      localStorage.setItem("gamesLastFetched", timestamp.toString());
      
    } catch (err) {
      console.error("Error fetching games data:", err);
      setError("Failed to fetch games data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GamesContext.Provider value={{ games, loading, error, lastFetched, fetchGames }}>
      {children}
    </GamesContext.Provider>
  );
}

// Custom hook to use the games context
export function useGames() {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
}
