"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { gamesApi } from "@/lib/api";

// Define the game details interface
export interface GameDetails {
  event_id: string;
  name: string;
  home_team: string;
  away_team: string;
  start: string;
  home_team_abbreviation?: string;
  away_team_abbreviation?: string;
  competition_name?: string;
  odds_lines?: OddsLine[];
}

export interface OddsLine {
  event_id: string;
  market_name: string;
  outcome_name: string;
  price: number;
  line?: number;
  participant?: string;
}

// Define the context interface
interface GameDetailsContextType {
  gameDetails: GameDetails | null;
  oddsLines: OddsLine[];
  loading: boolean;
  error: string | null;
  lastFetched: Record<string, number>; // Track fetch time by event ID
  fetchGameDetails: (eventId: string, forceRefresh?: boolean) => Promise<void>;
}

// Create context with default values
const GameDetailsContext = createContext<GameDetailsContextType>({
  gameDetails: null,
  oddsLines: [],
  loading: false,
  error: null,
  lastFetched: {},
  fetchGameDetails: async () => {},
});

// Cache expiration time - 5 minutes
const CACHE_EXPIRATION = 5 * 60 * 1000; 

export function GameDetailsProvider({ children }: { children: ReactNode }) {
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [oddsLines, setOddsLines] = useState<OddsLine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Record<string, number>>({});

  // Load cached data from localStorage on initial mount
  useEffect(() => {
    const cachedDetails = localStorage.getItem("gameDetailsData");
    const cachedLines = localStorage.getItem("gameOddsLines");
    const cachedTimestamp = localStorage.getItem("gameDetailsLastFetched");
    
    if (cachedDetails && cachedLines && cachedTimestamp) {
      try {
        const parsedDetails = JSON.parse(cachedDetails);
        const parsedLines = JSON.parse(cachedLines);
        const parsedTimestamp = JSON.parse(cachedTimestamp);
        
        setGameDetails(parsedDetails);
        setOddsLines(parsedLines);
        setLastFetched(parsedTimestamp);
      } catch (err) {
        console.error("Error parsing cached game details:", err);
      }
    }
  }, []);

  // Function to fetch game details
  const fetchGameDetails = async (eventId: string, forceRefresh = false) => {
    if (!eventId) return;
    
    // Check if we have cached data that's still valid
    if (
      !forceRefresh &&
      lastFetched[eventId] && 
      Date.now() - lastFetched[eventId] < CACHE_EXPIRATION &&
      localStorage.getItem("gameDetailsData") &&
      localStorage.getItem("gameOddsLines")
    ) {
      try {
        const cachedGameDetails = JSON.parse(localStorage.getItem("gameDetailsData") || "{}");
        const cachedOddsLines = JSON.parse(localStorage.getItem("gameOddsLines") || "[]");
        
        if (cachedGameDetails && cachedOddsLines.length > 0) {
          setGameDetails(cachedGameDetails);
          setOddsLines(cachedOddsLines);
          return;
        }
      } catch (e) {
        console.warn("Error parsing cached data", e);
        // Continue to fetch fresh data if parsing fails
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await gamesApi.getGameDetails(eventId);
      const timestamp = Date.now();
      
      if (data) {
        // If API returned empty data, create fallback mock data
        if (data.length === 0) {
          console.warn(`No odds data returned for ${eventId}, using fallback mock data`);
          
          // Extract team names from eventId (e.g., LAL_MIA)
          const teams = eventId.split('_');
          const teamMappings: Record<string, string> = {
            "LAL": "Los Angeles Lakers",
            "MIA": "Miami Heat",
            "GSW": "Golden State Warriors",
            "BOS": "Boston Celtics", 
            "PHX": "Phoenix Suns",
            "DAL": "Dallas Mavericks"
          };
          
          const homeTeam = teamMappings[teams[1]] || teams[1];
          const awayTeam = teamMappings[teams[0]] || teams[0];
          
          // Create fallback game details
          const gameInfo: GameDetails = {
            event_id: eventId,
            name: `${awayTeam} @ ${homeTeam}`,
            home_team: homeTeam,
            away_team: awayTeam,
            start: new Date(Date.now() + 86400000).toISOString(),
            home_team_abbreviation: teams[1],
            away_team_abbreviation: teams[0],
            competition_name: "NBA",
          };
          
          setGameDetails(gameInfo);
          setOddsLines([]);
          
          // Store this in the cache
          setLastFetched(prev => ({
            ...prev,
            [eventId]: timestamp
          }));
          
          localStorage.setItem("gameDetailsData", JSON.stringify(gameInfo));
          localStorage.setItem("gameOddsLines", JSON.stringify([]));
          localStorage.setItem("gameDetailsLastFetched", JSON.stringify({
            ...lastFetched,
            [eventId]: timestamp
          }));
          
          return;
        }
        
        const firstItem = data[0];
        const gameInfo: GameDetails = {
          event_id: firstItem.event_id,
          name: firstItem.event_name || `Game ${eventId}`,
          home_team: firstItem.home_team || "Home Team",
          away_team: firstItem.away_team || "Away Team",
          start: firstItem.start_date || new Date().toISOString(),
          home_team_abbreviation: firstItem.home_team_abbreviation || "HOME",
          away_team_abbreviation: firstItem.away_team_abbreviation || "AWAY",
          competition_name: firstItem.competition_name || "NBA"
        };
        
        setGameDetails(gameInfo);
        setOddsLines(data);
        
        // Update last fetched timestamp
        setLastFetched(prev => ({
          ...prev,
          [eventId]: timestamp
        }));
        
        // Cache in localStorage
        localStorage.setItem("gameDetailsData", JSON.stringify(gameInfo));
        localStorage.setItem("gameOddsLines", JSON.stringify(data));
        localStorage.setItem("gameDetailsLastFetched", JSON.stringify({
          ...lastFetched,
          [eventId]: timestamp
        }));
      } else {
        throw new Error("No data returned from API");
      }
    } catch (err) {
      console.error(`Error fetching game details for ${eventId}:`, err);
      
      // Create fallback data even on error
      const teams = eventId.split('_');
      const teamMappings: Record<string, string> = {
        "LAL": "Los Angeles Lakers",
        "MIA": "Miami Heat",
        "GSW": "Golden State Warriors",
        "BOS": "Boston Celtics", 
        "PHX": "Phoenix Suns",
        "DAL": "Dallas Mavericks"
      };
      
      const homeTeam = teamMappings[teams[1]] || teams[1];
      const awayTeam = teamMappings[teams[0]] || teams[0];
      
      const gameInfo: GameDetails = {
        event_id: eventId,
        name: `${awayTeam} @ ${homeTeam}`,
        home_team: homeTeam,
        away_team: awayTeam,
        start: new Date(Date.now() + 86400000).toISOString(),
        home_team_abbreviation: teams[1],
        away_team_abbreviation: teams[0],
        competition_name: "NBA",
      };
      
      setGameDetails(gameInfo);
      setError(`Could not fetch odds data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GameDetailsContext.Provider value={{ 
      gameDetails, 
      oddsLines, 
      loading, 
      error, 
      lastFetched,
      fetchGameDetails 
    }}>
      {children}
    </GameDetailsContext.Provider>
  );
}

// Custom hook to use the game details context
export function useGameDetails() {
  const context = useContext(GameDetailsContext);
  if (context === undefined) {
    throw new Error("useGameDetails must be used within a GameDetailsProvider");
  }
  return context;
}
