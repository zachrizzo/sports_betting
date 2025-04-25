"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw } from "lucide-react"
import { useGames, Game } from "@/contexts/games-context"

export default function GamesPage() {
  // Get games data from context instead of direct API call
  const { games, loading: isLoading, error, fetchGames, lastFetched } = useGames()

  useEffect(() => {
    // Fetch games if not already cached
    fetchGames()
  }, [fetchGames])

  const filterGamesByLeague = (league: string) => {
    if (league === "all") {
      return games
    }
    return games.filter((game) => game.competition_name === league)
  }
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date)
    } catch {
      return dateStr
    }
  }

  // Extract date and time parts
  const getDateAndTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return {
        date: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date),
        time: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
      }
    } catch {
      return { date: "TBD", time: "TBD" }
    }
  }
  
  // Handle manual refresh
  const handleRefresh = () => {
    fetchGames(true); // Force refresh
  }
  
  // Format the last fetch time
  const getLastUpdatedTime = () => {
    if (!lastFetched) return "Never updated";
    return new Date(lastFetched).toLocaleTimeString();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Games</h1>
          <p className="text-muted-foreground">
            Browse and analyze upcoming games across different leagues
            {lastFetched && <span className="ml-2 text-xs">Last updated: {getLastUpdatedTime()}</span>}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-2">Loading games...</span>
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-destructive">Error Loading Games</h2>
            <p className="mt-2">{error}</p>
            <p className="text-sm text-muted-foreground mt-1">Please check that the API server is running</p>
          </div>
        </Card>
      ) : games.length === 0 ? (
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold">No Games Available</h2>
            <p className="text-sm text-muted-foreground mt-1">Check back later for upcoming games</p>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Leagues</TabsTrigger>
            <TabsTrigger value="NBA">NBA</TabsTrigger>
            <TabsTrigger value="NFL">NFL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filterGamesByLeague("all").map((game) => (
                <GameCard key={game.event_id} game={game} formatDate={formatDate} getDateAndTime={getDateAndTime} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="NBA" className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filterGamesByLeague("NBA").map((game) => (
                <GameCard key={game.event_id} game={game} formatDate={formatDate} getDateAndTime={getDateAndTime} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="NFL" className="mt-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filterGamesByLeague("NFL").map((game) => (
                <GameCard key={game.event_id} game={game} formatDate={formatDate} getDateAndTime={getDateAndTime} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

interface GameCardProps {
  game: Game;
  formatDate: (date: string) => string;
  getDateAndTime: (date: string) => { date: string; time: string };
}

function GameCard({ game, formatDate, getDateAndTime }: GameCardProps) {
  const { date, time } = getDateAndTime(game.start);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center justify-between text-base">
          <Badge variant="outline">{game.competition_name || "NBA"}</Badge>
          <span className="text-sm font-normal text-muted-foreground">
            {date} • {time}
          </span>
        </CardTitle>
        <CardDescription>{formatDate(game.start)}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-muted font-semibold">
                {game.away_team_abbreviation || game.away_team.substring(0, 3).toUpperCase()}
              </div>
              <span className="font-semibold text-center">{game.away_team}</span>
            </div>
            <div className="px-4 text-xl font-bold text-muted-foreground">VS</div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-muted font-semibold">
                {game.home_team_abbreviation || game.home_team.substring(0, 3).toUpperCase()}
              </div>
              <span className="font-semibold text-center">{game.home_team}</span>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link href={`/games/${game.event_id}`}>View Game Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
