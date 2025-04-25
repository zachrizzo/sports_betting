"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, MapPin, Clock } from "lucide-react"

// Mock data - would be fetched from API
const mockGame = {
  id: "1",
  homeTeam: "Lakers",
  homeTeamLogo: "/placeholder.svg?height=80&width=80",
  homeTeamRecord: "10-5",
  awayTeam: "Celtics",
  awayTeamLogo: "/placeholder.svg?height=80&width=80",
  awayTeamRecord: "12-3",
  date: "2023-11-15",
  time: "7:30 PM",
  venue: "Staples Center",
  location: "Los Angeles, CA",
  league: "NBA",
  odds: {
    spread: "Lakers -3.5",
    total: "224.5",
    moneyline: {
      home: "-150",
      away: "+130",
    },
  },
}

const mockPlayerProps = {
  points: [
    {
      playerId: "1",
      playerName: "LeBron James",
      team: "Lakers",
      line: 25.5,
      over: "-110",
      under: "-110",
    },
    {
      playerId: "2",
      playerName: "Anthony Davis",
      team: "Lakers",
      line: 22.5,
      over: "-115",
      under: "-105",
    },
    {
      playerId: "3",
      playerName: "Jayson Tatum",
      team: "Celtics",
      line: 26.5,
      over: "-110",
      under: "-110",
    },
    {
      playerId: "4",
      playerName: "Jaylen Brown",
      team: "Celtics",
      line: 23.5,
      over: "-110",
      under: "-110",
    },
  ],
  rebounds: [
    {
      playerId: "1",
      playerName: "LeBron James",
      team: "Lakers",
      line: 7.5,
      over: "-120",
      under: "+100",
    },
    {
      playerId: "2",
      playerName: "Anthony Davis",
      team: "Lakers",
      line: 11.5,
      over: "-110",
      under: "-110",
    },
    {
      playerId: "3",
      playerName: "Jayson Tatum",
      team: "Celtics",
      line: 8.5,
      over: "-115",
      under: "-105",
    },
    {
      playerId: "4",
      playerName: "Jaylen Brown",
      team: "Celtics",
      line: 6.5,
      over: "-110",
      under: "-110",
    },
  ],
  assists: [
    {
      playerId: "1",
      playerName: "LeBron James",
      team: "Lakers",
      line: 7.5,
      over: "-125",
      under: "+105",
    },
    {
      playerId: "5",
      playerName: "D'Angelo Russell",
      team: "Lakers",
      line: 5.5,
      over: "-110",
      under: "-110",
    },
    {
      playerId: "6",
      playerName: "Jrue Holiday",
      team: "Celtics",
      line: 6.5,
      over: "-110",
      under: "-110",
    },
    {
      playerId: "3",
      playerName: "Jayson Tatum",
      team: "Celtics",
      line: 4.5,
      over: "-115",
      under: "-105",
    },
  ],
  threes: [
    {
      playerId: "1",
      playerName: "LeBron James",
      team: "Lakers",
      line: 2.5,
      over: "+110",
      under: "-130",
    },
    {
      playerId: "5",
      playerName: "D'Angelo Russell",
      team: "Lakers",
      line: 3.5,
      over: "-110",
      under: "-110",
    },
    {
      playerId: "3",
      playerName: "Jayson Tatum",
      team: "Celtics",
      line: 3.5,
      over: "-120",
      under: "+100",
    },
    {
      playerId: "4",
      playerName: "Jaylen Brown",
      team: "Celtics",
      line: 2.5,
      over: "-115",
      under: "-105",
    },
  ],
}

export default function GameDetailPage() {
  const params = useParams()
  const { id } = params
  const [game, setGame] = useState(null)
  const [playerProps, setPlayerProps] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchGameDetails = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch(`/api/games/${id}`)
        // const data = await response.json()
        // setGame(data)

        // Using mock data for now
        setTimeout(() => {
          setGame(mockGame)
          setPlayerProps(mockPlayerProps)
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching game details:", error)
        setIsLoading(false)
      }
    }

    fetchGameDetails()
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/games">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Loading game details...</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="h-[200px] animate-pulse bg-muted"></div>
              <div className="h-[400px] animate-pulse bg-muted"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/games">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Game not found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>The game you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-4" asChild>
              <Link href="/games">Back to Games</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/games">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {game.awayTeam} @ {game.homeTeam}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-1 flex-col items-center gap-2">
                <img
                  src={game.awayTeamLogo || "/placeholder.svg"}
                  alt={game.awayTeam}
                  className="h-24 w-24 object-contain"
                />
                <div className="text-center">
                  <h2 className="text-xl font-bold">{game.awayTeam}</h2>
                  <p className="text-muted-foreground">{game.awayTeamRecord}</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <Badge variant="outline" className="mb-2">
                  {game.league}
                </Badge>
                <div className="text-3xl font-bold">VS</div>
                <div className="mt-2 flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{game.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{game.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {game.venue}, {game.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2">
                <img
                  src={game.homeTeamLogo || "/placeholder.svg"}
                  alt={game.homeTeam}
                  className="h-24 w-24 object-contain"
                />
                <div className="text-center">
                  <h2 className="text-xl font-bold">{game.homeTeam}</h2>
                  <p className="text-muted-foreground">{game.homeTeamRecord}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-4 text-lg font-semibold">Game Odds</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Spread</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">{game.odds.spread}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Total</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold">O/U {game.odds.total}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Moneyline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{game.awayTeam}</p>
                        <p className="text-xl font-bold">{game.odds.moneyline.away}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{game.homeTeam}</p>
                        <p className="text-xl font-bold">{game.odds.moneyline.home}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-4 text-lg font-semibold">Player Props</h3>
              <Tabs defaultValue="points">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="points">Points</TabsTrigger>
                  <TabsTrigger value="rebounds">Rebounds</TabsTrigger>
                  <TabsTrigger value="assists">Assists</TabsTrigger>
                  <TabsTrigger value="threes">3-Pointers</TabsTrigger>
                </TabsList>
                <TabsContent value="points" className="mt-4">
                  <PlayerPropsTable props={playerProps.points} title="Points" />
                </TabsContent>
                <TabsContent value="rebounds" className="mt-4">
                  <PlayerPropsTable props={playerProps.rebounds} title="Rebounds" />
                </TabsContent>
                <TabsContent value="assists" className="mt-4">
                  <PlayerPropsTable props={playerProps.assists} title="Assists" />
                </TabsContent>
                <TabsContent value="threes" className="mt-4">
                  <PlayerPropsTable props={playerProps.threes} title="3-Pointers Made" />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PlayerPropsTable({ props, title }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Player</TableHead>
          <TableHead>Team</TableHead>
          <TableHead className="text-right">{title} Line</TableHead>
          <TableHead className="text-right">Over</TableHead>
          <TableHead className="text-right">Under</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.map((prop) => (
          <TableRow key={`${prop.playerId}-${title}`}>
            <TableCell className="font-medium">{prop.playerName}</TableCell>
            <TableCell>{prop.team}</TableCell>
            <TableCell className="text-right">{prop.line}</TableCell>
            <TableCell className="text-right">{prop.over}</TableCell>
            <TableCell className="text-right">{prop.under}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/players/${prop.playerId}`}>View Player</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
