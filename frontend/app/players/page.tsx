"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

// Mock data - would be fetched from API
const mockPlayers = [
  {
    id: "1",
    name: "LeBron James",
    team: "Lakers",
    position: "SF",
    ppg: 28.5,
    rpg: 8.2,
    apg: 6.8,
    fg: 52.3,
    threes: 2.1,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "Stephen Curry",
    team: "Warriors",
    position: "PG",
    ppg: 32.1,
    rpg: 5.5,
    apg: 7.2,
    fg: 49.8,
    threes: 5.2,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "Giannis Antetokounmpo",
    team: "Bucks",
    position: "PF",
    ppg: 29.8,
    rpg: 11.5,
    apg: 5.7,
    fg: 55.6,
    threes: 0.8,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "4",
    name: "Jayson Tatum",
    team: "Celtics",
    position: "SF",
    ppg: 26.9,
    rpg: 8.1,
    apg: 4.3,
    fg: 47.2,
    threes: 3.2,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "5",
    name: "Luka Dončić",
    team: "Mavericks",
    position: "PG",
    ppg: 33.2,
    rpg: 9.2,
    apg: 8.8,
    fg: 50.1,
    threes: 3.5,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "6",
    name: "Joel Embiid",
    team: "76ers",
    position: "C",
    ppg: 31.5,
    rpg: 10.8,
    apg: 4.2,
    fg: 53.7,
    threes: 1.2,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "7",
    name: "Nikola Jokić",
    team: "Nuggets",
    position: "C",
    ppg: 25.8,
    rpg: 12.5,
    apg: 9.8,
    fg: 58.3,
    threes: 1.5,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "8",
    name: "Kevin Durant",
    team: "Suns",
    position: "SF",
    ppg: 29.1,
    rpg: 6.7,
    apg: 5.2,
    fg: 52.9,
    threes: 2.8,
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

export default function PlayersPage() {
  const [players, setPlayers] = useState([])
  const [filteredPlayers, setFilteredPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [positionFilter, setPositionFilter] = useState("all")

  useEffect(() => {
    // Simulate API call
    const fetchPlayers = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch('/api/players')
        // const data = await response.json()
        // setPlayers(data)

        // Using mock data for now
        setTimeout(() => {
          setPlayers(mockPlayers)
          setFilteredPlayers(mockPlayers)
          setIsLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching players:", error)
        setIsLoading(false)
      }
    }

    fetchPlayers()
  }, [])

  useEffect(() => {
    let result = [...players]

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (player) =>
          player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.team.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by position
    if (positionFilter !== "all") {
      result = result.filter((player) => player.position === positionFilter)
    }

    setFilteredPlayers(result)
  }, [searchQuery, positionFilter, players])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground">Browse and analyze player statistics and betting props</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Database</CardTitle>
          <CardDescription>Search and filter players to find the best betting opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search players or teams..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="PG">Point Guard (PG)</SelectItem>
                <SelectItem value="SG">Shooting Guard (SG)</SelectItem>
                <SelectItem value="SF">Small Forward (SF)</SelectItem>
                <SelectItem value="PF">Power Forward (PF)</SelectItem>
                <SelectItem value="C">Center (C)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="h-[400px] animate-pulse bg-muted"></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="hidden md:table-cell">Position</TableHead>
                    <TableHead className="text-right">PPG</TableHead>
                    <TableHead className="hidden md:table-cell text-right">RPG</TableHead>
                    <TableHead className="hidden md:table-cell text-right">APG</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">FG%</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">3PM</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <img
                            src={player.avatar || "/placeholder.svg"}
                            alt={player.name}
                            className="h-8 w-8 rounded-full"
                          />
                          {player.name}
                        </div>
                      </TableCell>
                      <TableCell>{player.team}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{player.position}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{player.ppg}</TableCell>
                      <TableCell className="hidden md:table-cell text-right">{player.rpg}</TableCell>
                      <TableCell className="hidden md:table-cell text-right">{player.apg}</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{player.fg}%</TableCell>
                      <TableCell className="hidden lg:table-cell text-right">{player.threes}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/players/${player.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
