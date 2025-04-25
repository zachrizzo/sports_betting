import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, TrendingUp, Percent } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import UserStatsChart from "@/components/user-stats-chart"
import { ApiStatus } from "@/components/api-status";
import { UpcomingGames } from "@/components/upcoming-games";

export default function Dashboard() {
  // This would be fetched from your API
  const upcomingGames = [
    {
      id: "1",
      homeTeam: "Lakers",
      awayTeam: "Celtics",
      date: "2023-11-15",
      time: "7:30 PM",
    },
    {
      id: "2",
      homeTeam: "Warriors",
      awayTeam: "Nets",
      date: "2023-11-16",
      time: "8:00 PM",
    },
    {
      id: "3",
      homeTeam: "Bucks",
      awayTeam: "76ers",
      date: "2023-11-17",
      time: "7:00 PM",
    },
  ]

  // This would be fetched from your API
  const trendingPlayers = [
    {
      id: "1",
      name: "LeBron James",
      team: "Lakers",
      position: "SF",
      points: 28.5,
      rebounds: 8.2,
      assists: 6.8,
    },
    {
      id: "2",
      name: "Stephen Curry",
      team: "Warriors",
      position: "PG",
      points: 32.1,
      rebounds: 5.5,
      assists: 7.2,
    },
    {
      id: "3",
      name: "Giannis Antetokounmpo",
      team: "Bucks",
      position: "PF",
      points: 29.8,
      rebounds: 11.5,
      assists: 5.7,
    },
  ]

  // Mock user betting data
  const userBettingStats = {
    balance: 1250.75,
    totalWinnings: 3450.25,
    totalLosses: 2199.5,
    winPercentage: 62,
    totalBets: 48,
    wonBets: 30,
    lostBets: 18,
  }

  // Mock recent bets
  const recentBets = [
    {
      id: "1",
      date: "2023-11-12",
      game: "Lakers vs Suns",
      type: "Player Prop",
      description: "LeBron James Over 25.5 Points",
      amount: 50,
      odds: "+110",
      status: "Won",
      payout: 105,
    },
    {
      id: "2",
      date: "2023-11-10",
      game: "Warriors vs Clippers",
      type: "Spread",
      description: "Warriors -3.5",
      amount: 100,
      odds: "-110",
      status: "Lost",
      payout: 0,
    },
    {
      id: "3",
      date: "2023-11-08",
      game: "Bucks vs 76ers",
      type: "Moneyline",
      description: "Bucks to Win",
      amount: 75,
      odds: "-130",
      status: "Won",
      payout: 132.69,
    },
    {
      id: "4",
      date: "2023-11-05",
      game: "Celtics vs Knicks",
      type: "Player Prop",
      description: "Jayson Tatum Over 7.5 Rebounds",
      amount: 50,
      odds: "-115",
      status: "Won",
      payout: 93.48,
    },
    {
      id: "5",
      date: "2023-11-03",
      game: "Nets vs Raptors",
      type: "Total",
      description: "Under 220.5",
      amount: 100,
      odds: "-110",
      status: "Lost",
      payout: 0,
    },
  ]

  // Mock recommended bets
  const recommendedBets = [
    {
      id: "1",
      game: "Lakers vs Celtics",
      type: "Player Prop",
      description: "LeBron James Over 25.5 Points",
      odds: "+110",
      confidence: 85,
      recommendedAmount: 75,
    },
    {
      id: "2",
      game: "Warriors vs Nets",
      type: "Spread",
      description: "Warriors -4.5",
      odds: "-110",
      confidence: 72,
      recommendedAmount: 50,
    },
    {
      id: "3",
      game: "Bucks vs 76ers",
      type: "Player Prop",
      description: "Giannis Antetokounmpo Over 29.5 Points",
      odds: "-115",
      confidence: 78,
      recommendedAmount: 65,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ApiStatus />
        </div>
        
        <div className="md:col-span-2">
          <UpcomingGames />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your betting activity and insights.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">DraftKings Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userBettingStats.balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available for betting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userBettingStats.totalWinnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Percentage</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBettingStats.winPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {userBettingStats.wonBets} of {userBettingStats.totalBets} bets won
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Games</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingGames.length}</div>
            <p className="text-xs text-muted-foreground">Games to analyze</p>
            <div className="mt-4">
              <Button size="sm" asChild>
                <Link href="/games">View all games</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Betting Performance</CardTitle>
            <CardDescription>Your betting performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <UserStatsChart />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bets</CardTitle>
            <CardDescription>Your most recent betting activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bet</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell className="font-medium">{bet.date}</TableCell>
                    <TableCell>
                      <div className="font-medium">{bet.description}</div>
                      <div className="text-xs text-muted-foreground">{bet.game}</div>
                    </TableCell>
                    <TableCell>${bet.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={bet.status === "Won" ? "default" : "destructive"}>
                        {bet.status}
                        {bet.status === "Won" && ` +$${bet.payout.toFixed(2)}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Bets</CardTitle>
            <CardDescription>AI-powered betting recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendedBets.map((bet) => (
                <div key={bet.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-medium">{bet.description}</div>
                    <Badge variant="outline">{bet.odds}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{bet.game}</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Confidence</span>
                      <span className="font-medium">{bet.confidence}%</span>
                    </div>
                    <Progress value={bet.confidence} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm">
                      Recommended: <span className="font-medium">${bet.recommendedAmount}</span>
                    </div>
                    <Button size="sm">Place Bet</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trending Players</CardTitle>
            <CardDescription>Players with notable recent performances</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trendingPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {player.name}
                      <div className="text-xs text-muted-foreground">{player.position}</div>
                    </TableCell>
                    <TableCell>{player.team}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant="outline">{player.points} PTS</Badge>
                        <Badge variant="outline">{player.rebounds} REB</Badge>
                        <Badge variant="outline">{player.assists} AST</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/players/${player.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Games</CardTitle>
            <CardDescription>Games scheduled for the next few days</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matchup</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingGames.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">
                      {game.awayTeam} @ {game.homeTeam}
                    </TableCell>
                    <TableCell>{game.date}</TableCell>
                    <TableCell>{game.time}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/games/${game.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
