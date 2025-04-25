"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// This would be fetched from your API
const mockGames = [
  {
    id: "1",
    homeTeam: "Lakers",
    homeTeamLogo: "/placeholder.svg?height=40&width=40",
    awayTeam: "Celtics",
    awayTeamLogo: "/placeholder.svg?height=40&width=40",
    date: "2023-11-15",
    time: "7:30 PM",
    venue: "Staples Center",
    league: "NBA",
  },
  {
    id: "2",
    homeTeam: "Warriors",
    homeTeamLogo: "/placeholder.svg?height=40&width=40",
    awayTeam: "Nets",
    awayTeamLogo: "/placeholder.svg?height=40&width=40",
    date: "2023-11-16",
    time: "8:00 PM",
    venue: "Chase Center",
    league: "NBA",
  },
  {
    id: "3",
    homeTeam: "Bucks",
    homeTeamLogo: "/placeholder.svg?height=40&width=40",
    awayTeam: "76ers",
    awayTeamLogo: "/placeholder.svg?height=40&width=40",
    date: "2023-11-17",
    time: "7:00 PM",
    venue: "Fiserv Forum",
    league: "NBA",
  },
  {
    id: "4",
    homeTeam: "Heat",
    homeTeamLogo: "/placeholder.svg?height=40&width=40",
    awayTeam: "Knicks",
    awayTeamLogo: "/placeholder.svg?height=40&width=40",
    date: "2023-11-18",
    time: "7:30 PM",
    venue: "FTX Arena",
    league: "NBA",
  },
  {
    id: "5",
    homeTeam: "Suns",
    homeTeamLogo: "/placeholder.svg?height=40&width=40",
    awayTeam: "Mavericks",
    awayTeamLogo: "/placeholder.svg?height=40&width=40",
    date: "2023-11-19",
    time: "9:00 PM",
    venue: "Footprint Center",
    league: "NBA",
  },
  {
    id: "6",
    homeTeam: "Chiefs",
    homeTeamLogo: "/placeholder.svg?height=40&width=40",
    awayTeam: "Eagles",
    awayTeamLogo: "/placeholder.svg?height=40&width=40",
    date: "2023-11-20",
    time: "8:15 PM",
    venue: "Arrowhead Stadium",
    league: "NFL",
  },
]

export default function GamesPage() {
  const [games, setGames] = useState(mockGames)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    // Simulate API call
    const fetchGames = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/games/upcoming')
        // const data = await response.json()
        // setGames(data)

        // Using mock data for now
        setTimeout(() => {
          setGames(mockGames)
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching games:", error)
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [])

  const filterGamesByLeague = (league) => {
    if (league === "all") {
      return games
    }
    return games.filter((game) => game.league === league)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Games</h1>
          <p className="text-muted-foreground">Browse and analyze upcoming games across different leagues</p>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Leagues</TabsTrigger>
          <TabsTrigger value="NBA">NBA</TabsTrigger>
          <TabsTrigger value="NFL">NFL</TabsTrigger>
          <TabsTrigger value="MLB">MLB</TabsTrigger>
          <TabsTrigger value="NHL">NHL</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(6)
                  .fill(null)
                  .map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-[250px] animate-pulse bg-muted"></div>
                    </Card>
                  ))
              : filterGamesByLeague("all").map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        </TabsContent>
        <TabsContent value="NBA" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(3)
                  .fill(null)
                  .map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-[250px] animate-pulse bg-muted"></div>
                    </Card>
                  ))
              : filterGamesByLeague("NBA").map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        </TabsContent>
        <TabsContent value="NFL" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(2)
                  .fill(null)
                  .map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-[250px] animate-pulse bg-muted"></div>
                    </Card>
                  ))
              : filterGamesByLeague("NFL").map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        </TabsContent>
        <TabsContent value="MLB" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(2)
                  .fill(null)
                  .map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-[250px] animate-pulse bg-muted"></div>
                    </Card>
                  ))
              : filterGamesByLeague("MLB").map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        </TabsContent>
        <TabsContent value="NHL" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array(2)
                  .fill(null)
                  .map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="h-[250px] animate-pulse bg-muted"></div>
                    </Card>
                  ))
              : filterGamesByLeague("NHL").map((game) => <GameCard key={game.id} game={game} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GameCard({ game }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center justify-between text-base">
          <Badge variant="outline">{game.league}</Badge>
          <span className="text-sm font-normal text-muted-foreground">
            {game.date} • {game.time}
          </span>
        </CardTitle>
        <CardDescription>{game.venue}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 flex-col items-center gap-2">
              <img
                src={game.awayTeamLogo || "/placeholder.svg"}
                alt={game.awayTeam}
                className="h-16 w-16 object-contain"
              />
              <span className="font-semibold">{game.awayTeam}</span>
            </div>
            <div className="px-4 text-xl font-bold text-muted-foreground">VS</div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <img
                src={game.homeTeamLogo || "/placeholder.svg"}
                alt={game.homeTeam}
                className="h-16 w-16 object-contain"
              />
              <span className="font-semibold">{game.homeTeam}</span>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link href={`/games/${game.id}`}>View Game Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
