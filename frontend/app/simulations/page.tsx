"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock data - would be fetched from API
const mockGames = [
  {
    id: "all",
    name: "All Games",
  },
  {
    id: "1",
    name: "Lakers vs Celtics - 2023-11-15",
  },
  {
    id: "2",
    name: "Warriors vs Nets - 2023-11-16",
  },
  {
    id: "3",
    name: "Bucks vs 76ers - 2023-11-17",
  },
]

const mockPlayers = [
  {
    id: "all",
    name: "All Players",
  },
  {
    id: "1",
    name: "LeBron James - Lakers",
  },
  {
    id: "2",
    name: "Anthony Davis - Lakers",
  },
  {
    id: "3",
    name: "Jayson Tatum - Celtics",
  },
  {
    id: "4",
    name: "Jaylen Brown - Celtics",
  },
]

const mockMarkets = [
  {
    id: "all",
    name: "All Markets",
  },
  {
    id: "points",
    name: "Points",
  },
  {
    id: "rebounds",
    name: "Rebounds",
  },
  {
    id: "assists",
    name: "Assists",
  },
  {
    id: "threes",
    name: "3-Pointers",
  },
]

const mockSimulationResults = {
  gameScore: {
    homeTeam: "Lakers",
    awayTeam: "Celtics",
    homeScore: 108,
    awayScore: 102,
    homeWinProbability: 0.62,
    overUnderLine: 214.5,
    overProbability: 0.45,
    spreadLine: -3.5,
    spreadCoverProbability: 0.58,
  },
  playerProps: [
    {
      playerId: "1",
      playerName: "LeBron James",
      team: "Lakers",
      points: {
        line: 25.5,
        average: 27.2,
        median: 26.0,
        overProbability: 0.65,
        distribution: [
          { range: "15-19", frequency: 10 },
          { range: "20-24", frequency: 25 },
          { range: "25-29", frequency: 40 },
          { range: "30-34", frequency: 20 },
          { range: "35+", frequency: 5 },
        ],
      },
      rebounds: {
        line: 7.5,
        average: 8.1,
        median: 8.0,
        overProbability: 0.58,
      },
      assists: {
        line: 7.5,
        average: 6.9,
        median: 7.0,
        overProbability: 0.42,
      },
    },
    {
      playerId: "3",
      playerName: "Jayson Tatum",
      team: "Celtics",
      points: {
        line: 26.5,
        average: 28.3,
        median: 27.0,
        overProbability: 0.61,
        distribution: [
          { range: "15-19", frequency: 5 },
          { range: "20-24", frequency: 20 },
          { range: "25-29", frequency: 45 },
          { range: "30-34", frequency: 25 },
          { range: "35+", frequency: 5 },
        ],
      },
      rebounds: {
        line: 8.5,
        average: 7.8,
        median: 8.0,
        overProbability: 0.43,
      },
      assists: {
        line: 4.5,
        average: 4.2,
        median: 4.0,
        overProbability: 0.48,
      },
    },
  ],
  allGamesSimulation: [
    {
      id: "1",
      game: "Lakers vs Celtics",
      date: "2023-11-15",
      spread: "Lakers -3.5",
      spreadConfidence: 58,
      total: "214.5",
      totalDirection: "Under",
      totalConfidence: 55,
      moneyline: "Lakers -150",
      moneylineConfidence: 62,
      recommendedBet: "Lakers -3.5",
      recommendedAmount: 75,
    },
    {
      id: "2",
      game: "Warriors vs Nets",
      date: "2023-11-16",
      spread: "Warriors -4.5",
      spreadConfidence: 63,
      total: "228.5",
      totalDirection: "Over",
      totalConfidence: 59,
      moneyline: "Warriors -180",
      moneylineConfidence: 65,
      recommendedBet: "Over 228.5",
      recommendedAmount: 100,
    },
    {
      id: "3",
      game: "Bucks vs 76ers",
      date: "2023-11-17",
      spread: "Bucks -2.5",
      spreadConfidence: 52,
      total: "219.5",
      totalDirection: "Under",
      totalConfidence: 57,
      moneyline: "Bucks -130",
      moneylineConfidence: 56,
      recommendedBet: "Under 219.5",
      recommendedAmount: 50,
    },
  ],
  allPlayersProps: [
    {
      id: "1",
      player: "LeBron James",
      team: "Lakers",
      game: "Lakers vs Celtics",
      date: "2023-11-15",
      market: "Points",
      line: 25.5,
      direction: "Over",
      confidence: 65,
      recommendedBet: "Over 25.5 Points",
      recommendedAmount: 75,
    },
    {
      id: "2",
      player: "Anthony Davis",
      team: "Lakers",
      game: "Lakers vs Celtics",
      date: "2023-11-15",
      market: "Rebounds",
      line: 11.5,
      direction: "Over",
      confidence: 62,
      recommendedBet: "Over 11.5 Rebounds",
      recommendedAmount: 50,
    },
    {
      id: "3",
      player: "Jayson Tatum",
      team: "Celtics",
      game: "Lakers vs Celtics",
      date: "2023-11-15",
      market: "Points",
      line: 26.5,
      direction: "Over",
      confidence: 61,
      recommendedBet: "Over 26.5 Points",
      recommendedAmount: 60,
    },
    {
      id: "4",
      player: "Stephen Curry",
      team: "Warriors",
      game: "Warriors vs Nets",
      date: "2023-11-16",
      market: "3-Pointers",
      line: 4.5,
      direction: "Over",
      confidence: 72,
      recommendedBet: "Over 4.5 3-Pointers",
      recommendedAmount: 100,
    },
    {
      id: "5",
      player: "Giannis Antetokounmpo",
      team: "Bucks",
      game: "Bucks vs 76ers",
      date: "2023-11-17",
      market: "Points",
      line: 29.5,
      direction: "Over",
      confidence: 68,
      recommendedBet: "Over 29.5 Points",
      recommendedAmount: 80,
    },
  ],
}

export default function SimulationsPage() {
  const [selectedGame, setSelectedGame] = useState("all")
  const [selectedPlayer, setSelectedPlayer] = useState("all")
  const [selectedMarket, setSelectedMarket] = useState("all")
  const [betAmount, setBetAmount] = useState("100")
  const [isLoading, setIsLoading] = useState(false)
  const [simulationResults, setSimulationResults] = useState(null)
  const [activeTab, setActiveTab] = useState("games")

  const runSimulation = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setSimulationResults(mockSimulationResults)
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Simulations</h1>
        <p className="text-muted-foreground">
          Run advanced simulations to predict game outcomes and player performances
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulation Parameters</CardTitle>
          <CardDescription>
            Select parameters to run a simulation or leave as "All" for comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Game</label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {mockGames.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Player</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {mockPlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Market</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a market" />
                </SelectTrigger>
                <SelectContent>
                  {mockMarkets.map((market) => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Betting Budget</label>
              <Select value={betAmount} onValueChange={setBetAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">$50</SelectItem>
                  <SelectItem value="100">$100</SelectItem>
                  <SelectItem value="200">$200</SelectItem>
                  <SelectItem value="500">$500</SelectItem>
                  <SelectItem value="1000">$1,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-6 w-full" onClick={runSimulation} disabled={isLoading}>
            {isLoading ? "Running Simulation..." : "Run Simulation"}
          </Button>
          {isLoading && <Progress className="mt-4" value={45} />}
        </CardContent>
      </Card>

      {simulationResults && (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="games">Game Predictions</TabsTrigger>
              <TabsTrigger value="players">Player Props</TabsTrigger>
              {selectedGame !== "all" && <TabsTrigger value="specific-game">Specific Game</TabsTrigger>}
              {selectedPlayer !== "all" && <TabsTrigger value="specific-player">Specific Player</TabsTrigger>}
            </TabsList>

            <TabsContent value="games" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Game Predictions</CardTitle>
                  <CardDescription>Predictions for upcoming games with betting recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Spread</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Moneyline</TableHead>
                        <TableHead>Recommended Bet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulationResults.allGamesSimulation.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium">{game.game}</TableCell>
                          <TableCell>{game.date}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{game.spread}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={game.spreadConfidence} className="h-2 w-16" />
                                <span className="text-xs text-muted-foreground">{game.spreadConfidence}%</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>
                                {game.totalDirection} {game.total}
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress value={game.totalConfidence} className="h-2 w-16" />
                                <span className="text-xs text-muted-foreground">{game.totalConfidence}%</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{game.moneyline}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={game.moneylineConfidence} className="h-2 w-16" />
                                <span className="text-xs text-muted-foreground">{game.moneylineConfidence}%</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge className="w-fit">{game.recommendedBet}</Badge>
                              <span className="text-xs text-muted-foreground">Bet ${game.recommendedAmount}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="players" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Player Props Predictions</CardTitle>
                  <CardDescription>Predictions for player props with betting recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead>Market</TableHead>
                        <TableHead>Line</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Recommended Bet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulationResults.allPlayersProps.map((prop) => (
                        <TableRow key={prop.id}>
                          <TableCell className="font-medium">
                            {prop.player}
                            <div className="text-xs text-muted-foreground">{prop.team}</div>
                          </TableCell>
                          <TableCell>{prop.game}</TableCell>
                          <TableCell>{prop.market}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{prop.direction}</span>
                              <span>{prop.line}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={prop.confidence} className="h-2 w-16" />
                              <span>{prop.confidence}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Badge className="w-fit">{prop.recommendedBet}</Badge>
                              <span className="text-xs text-muted-foreground">Bet ${prop.recommendedAmount}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {selectedGame !== "all" && (
              <TabsContent value="specific-game" className="mt-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Game Prediction</CardTitle>
                    <CardDescription>
                      {simulationResults.gameScore.awayTeam} @ {simulationResults.gameScore.homeTeam}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="flex flex-1 flex-col items-center gap-2">
                        <h3 className="text-lg font-semibold">{simulationResults.gameScore.awayTeam}</h3>
                        <div className="text-4xl font-bold">{simulationResults.gameScore.awayScore}</div>
                        <p className="text-sm text-muted-foreground">Projected Score</p>
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-2">
                        <h3 className="text-lg font-semibold">{simulationResults.gameScore.homeTeam}</h3>
                        <div className="text-4xl font-bold">{simulationResults.gameScore.homeScore}</div>
                        <p className="text-sm text-muted-foreground">Projected Score</p>
                      </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Win Probability</p>
                        <div className="flex items-center justify-between">
                          <span>{simulationResults.gameScore.homeTeam}</span>
                          <Badge variant="outline">
                            {(simulationResults.gameScore.homeWinProbability * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={simulationResults.gameScore.homeWinProbability * 100} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Over/Under ({simulationResults.gameScore.overUnderLine})
                        </p>
                        <div className="flex items-center justify-between">
                          <span>Over</span>
                          <Badge variant="outline">
                            {(simulationResults.gameScore.overProbability * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={simulationResults.gameScore.overProbability * 100} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Spread ({simulationResults.gameScore.homeTeam} {simulationResults.gameScore.spreadLine})
                        </p>
                        <div className="flex items-center justify-between">
                          <span>Cover</span>
                          <Badge variant="outline">
                            {(simulationResults.gameScore.spreadCoverProbability * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <Progress value={simulationResults.gameScore.spreadCoverProbability * 100} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {selectedPlayer !== "all" && (
              <TabsContent value="specific-player" className="mt-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Player Props Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="player-1">
                      <TabsList className="w-full justify-start">
                        {simulationResults.playerProps.map((player, index) => (
                          <TabsTrigger key={player.playerId} value={`player-${index + 1}`}>
                            {player.playerName}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {simulationResults.playerProps.map((player, index) => (
                        <TabsContent key={player.playerId} value={`player-${index + 1}`} className="mt-4">
                          <div className="grid gap-6 md:grid-cols-3">
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Points</h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Line</span>
                                  <span className="font-medium">{player.points.line}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Projected Average</span>
                                  <span className="font-medium">{player.points.average}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Projected Median</span>
                                  <span className="font-medium">{player.points.median}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Over Probability</span>
                                  <Badge variant="outline">{(player.points.overProbability * 100).toFixed(1)}%</Badge>
                                </div>
                                <Progress value={player.points.overProbability * 100} />
                              </div>
                              <div className="h-60">
                                <ChartContainer
                                  config={{
                                    frequency: {
                                      label: "Frequency",
                                      color: "hsl(var(--chart-1))",
                                    },
                                  }}
                                  className="h-full"
                                >
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={player.points.distribution}
                                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="range" />
                                      <YAxis />
                                      <ChartTooltip content={<ChartTooltipContent />} />
                                      <Bar dataKey="frequency" fill="var(--color-frequency)" name="Frequency" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </ChartContainer>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Rebounds</h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Line</span>
                                  <span className="font-medium">{player.rebounds.line}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Projected Average</span>
                                  <span className="font-medium">{player.rebounds.average}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Projected Median</span>
                                  <span className="font-medium">{player.rebounds.median}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Over Probability</span>
                                  <Badge variant="outline">{(player.rebounds.overProbability * 100).toFixed(1)}%</Badge>
                                </div>
                                <Progress value={player.rebounds.overProbability * 100} />
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold">Assists</h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Line</span>
                                  <span className="font-medium">{player.assists.line}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Projected Average</span>
                                  <span className="font-medium">{player.assists.average}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Projected Median</span>
                                  <span className="font-medium">{player.assists.median}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Over Probability</span>
                                  <Badge variant="outline">{(player.assists.overProbability * 100).toFixed(1)}%</Badge>
                                </div>
                                <Progress value={player.assists.overProbability * 100} />
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  )
}
