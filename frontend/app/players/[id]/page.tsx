"use client"

import { useState, useEffect } from "react"
import Link from "next/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import PlayerStatsChart from "@/components/player-stats-chart"

// Mock data - would be fetched from API
const mockPlayer = {
  id: "1",
  name: "LeBron James",
  team: "Lakers",
  position: "SF",
  height: "6'9\"",
  weight: "250 lbs",
  age: 38,
  college: "None",
  avatar: "/placeholder.svg?height=200&width=200",
  stats: {
    ppg: 28.5,
    rpg: 8.2,
    apg: 6.8,
    spg: 1.3,
    bpg: 0.8,
    fg: 52.3,
    threes: 2.1,
    ft: 73.5,
    mpg: 35.2,
  },
}

const mockGameHistory = [
  {
    id: "1",
    date: "2023-11-10",
    opponent: "Suns",
    result: "W 112-108",
    minutes: 36,
    points: 32,
    rebounds: 8,
    assists: 7,
    steals: 1,
    blocks: 1,
    fg: "12-22",
    threes: "3-8",
    ft: "5-6",
  },
  {
    id: "2",
    date: "2023-11-08",
    opponent: "Clippers",
    result: "L 105-110",
    minutes: 38,
    points: 30,
    rebounds: 10,
    assists: 5,
    steals: 2,
    blocks: 0,
    fg: "11-24",
    threes: "2-7",
    ft: "6-8",
  },
  {
    id: "3",
    date: "2023-11-06",
    opponent: "Heat",
    result: "W 118-105",
    minutes: 34,
    points: 25,
    rebounds: 7,
    assists: 9,
    steals: 1,
    blocks: 2,
    fg: "9-18",
    threes: "2-5",
    ft: "5-5",
  },
  {
    id: "4",
    date: "2023-11-04",
    opponent: "Nuggets",
    result: "W 122-115",
    minutes: 37,
    points: 28,
    rebounds: 9,
    assists: 8,
    steals: 0,
    blocks: 1,
    fg: "10-20",
    threes: "3-6",
    ft: "5-7",
  },
  {
    id: "5",
    date: "2023-11-02",
    opponent: "Mavericks",
    result: "L 112-120",
    minutes: 35,
    points: 26,
    rebounds: 6,
    assists: 5,
    steals: 2,
    blocks: 0,
    fg: "10-19",
    threes: "1-4",
    ft: "5-6",
  },
]

const mockUpcomingProps = [
  {
    id: "1",
    gameId: "101",
    opponent: "Celtics",
    date: "2023-11-15",
    market: "Points",
    line: 25.5,
    over: "-110",
    under: "-110",
  },
  {
    id: "2",
    gameId: "101",
    opponent: "Celtics",
    date: "2023-11-15",
    market: "Rebounds",
    line: 7.5,
    over: "-120",
    under: "+100",
  },
  {
    id: "3",
    gameId: "101",
    opponent: "Celtics",
    date: "2023-11-15",
    market: "Assists",
    line: 7.5,
    over: "-125",
    under: "+105",
  },
  {
    id: "4",
    gameId: "101",
    opponent: "Celtics",
    date: "2023-11-15",
    market: "3-Pointers Made",
    line: 2.5,
    over: "+110",
    under: "-130",
  },
  {
    id: "5",
    gameId: "102",
    opponent: "Knicks",
    date: "2023-11-18",
    market: "Points",
    line: 26.5,
    over: "-110",
    under: "-110",
  },
  {
    id: "6",
    gameId: "102",
    opponent: "Knicks",
    date: "2023-11-18",
    market: "Rebounds",
    line: 8.5,
    over: "-110",
    under: "-110",
  },
]

export default function PlayerDetailPage() {
  const params = useParams()
  const { id } = params
  const [player, setPlayer] = useState(null)
  const [gameHistory, setGameHistory] = useState([])
  const [upcomingProps, setUpcomingProps] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchPlayerDetails = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch(`/api/players/${id}`)
        // const data = await response.json()
        // setPlayer(data)

        // Using mock data for now
        setTimeout(() => {
          setPlayer(mockPlayer)
          setGameHistory(mockGameHistory)
          setUpcomingProps(mockUpcomingProps)
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching player details:", error)
        setIsLoading(false)
      }
    }

    fetchPlayerDetails()
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/players">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Loading player details...</h1>
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

  if (!player) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/players">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Player not found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>The player you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-4" asChild>
              <Link href="/players">Back to Players</Link>
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
          <Link href="/players">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{player.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <img
                src={player.avatar || "/placeholder.svg"}
                alt={player.name}
                className="h-48 w-48 rounded-full object-cover"
              />
              <div className="text-center">
                <h2 className="text-2xl font-bold">{player.name}</h2>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline">{player.position}</Badge>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">{player.team}</span>
                </div>
              </div>
              <Separator />
              <div className="grid w-full grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="font-medium">{player.height}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-medium">{player.weight}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{player.age}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">College</p>
                  <p className="font-medium">{player.college}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Season Statistics</CardTitle>
            <CardDescription>Current season averages and key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
              <StatCard title="PPG" value={player.stats.ppg} />
              <StatCard title="RPG" value={player.stats.rpg} />
              <StatCard title="APG" value={player.stats.apg} />
              <StatCard title="SPG" value={player.stats.spg} />
              <StatCard title="BPG" value={player.stats.bpg} />
              <StatCard title="FG%" value={`${player.stats.fg}%`} />
              <StatCard title="3PM" value={player.stats.threes} />
              <StatCard title="FT%" value={`${player.stats.ft}%`} />
              <StatCard title="MPG" value={player.stats.mpg} />
            </div>
            <div className="mt-6 h-80">
              <PlayerStatsChart player={player} gameHistory={gameHistory} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="game-history">
            <TabsList>
              <TabsTrigger value="game-history">Game History</TabsTrigger>
              <TabsTrigger value="upcoming-props">Upcoming Props</TabsTrigger>
              <TabsTrigger value="prop-history">Prop History</TabsTrigger>
            </TabsList>
            <TabsContent value="game-history" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">MIN</TableHead>
                    <TableHead className="text-right">PTS</TableHead>
                    <TableHead className="text-right">REB</TableHead>
                    <TableHead className="text-right">AST</TableHead>
                    <TableHead className="text-right">STL</TableHead>
                    <TableHead className="text-right">BLK</TableHead>
                    <TableHead className="text-right">FG</TableHead>
                    <TableHead className="text-right">3PT</TableHead>
                    <TableHead className="text-right">FT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gameHistory.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell>{game.date}</TableCell>
                      <TableCell>{game.opponent}</TableCell>
                      <TableCell>{game.result}</TableCell>
                      <TableCell className="text-right">{game.minutes}</TableCell>
                      <TableCell className="text-right">{game.points}</TableCell>
                      <TableCell className="text-right">{game.rebounds}</TableCell>
                      <TableCell className="text-right">{game.assists}</TableCell>
                      <TableCell className="text-right">{game.steals}</TableCell>
                      <TableCell className="text-right">{game.blocks}</TableCell>
                      <TableCell className="text-right">{game.fg}</TableCell>
                      <TableCell className="text-right">{game.threes}</TableCell>
                      <TableCell className="text-right">{game.ft}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="upcoming-props" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead className="text-right">Line</TableHead>
                    <TableHead className="text-right">Over</TableHead>
                    <TableHead className="text-right">Under</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingProps.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell>{prop.date}</TableCell>
                      <TableCell>{prop.opponent}</TableCell>
                      <TableCell>{prop.market}</TableCell>
                      <TableCell className="text-right">{prop.line}</TableCell>
                      <TableCell className="text-right">{prop.over}</TableCell>
                      <TableCell className="text-right">{prop.under}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/games/${prop.gameId}`}>View Game</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="prop-history" className="mt-4">
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Prop history data coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="flex flex-col items-center rounded-lg border p-3 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}
