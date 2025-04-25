"use client";

import { useEffect, useState } from "react";
import { gamesApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface Game {
  event_id: string;
  event_name: string;
  start_date: string;
  home_team?: string;
  away_team?: string;
  home_team_abbreviation?: string;
  away_team_abbreviation?: string;
  competition_name?: string;
  [key: string]: any;
}

export function UpcomingGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const data = await gamesApi.getUpcomingGames();
        setGames(data);
        setError(null);
      } catch (err) {
        setError("Failed to load upcoming games");
        console.error("Error fetching upcoming games:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upcoming Games</CardTitle>
        <CardDescription>
          Next scheduled NBA games for betting
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <p className="text-sm mt-2">Please ensure the API server is running</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No upcoming games found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.event_id} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{game.event_name || "NBA Game"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(game.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {game.competition_name || "NBA"}
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="text-center">
                      <div className="h-8 w-8 mx-auto bg-muted rounded-full flex items-center justify-center">
                        {game.away_team_abbreviation || "Away"}
                      </div>
                      <p className="text-xs mt-1 truncate">{game.away_team || "Away Team"}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-bold">VS</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="h-8 w-8 mx-auto bg-muted rounded-full flex items-center justify-center">
                        {game.home_team_abbreviation || "Home"}
                      </div>
                      <p className="text-xs mt-1 truncate">{game.home_team || "Home Team"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
