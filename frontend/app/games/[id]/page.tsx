"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, Clock, RefreshCw, Loader2 } from "lucide-react"
import { useGameDetails, OddsLine } from "@/contexts/game-details-context"

export default function GameDetailPage() {
  const params = useParams()
  const eventId = params.id as string
  const { gameDetails, oddsLines, loading, error, fetchGameDetails } = useGameDetails()

  useEffect(() => {
    if (eventId) {
      fetchGameDetails(eventId)
    }
  }, [eventId, fetchGameDetails])

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "TBD"
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date)
    } catch {
      return dateStr
    }
  }

  // Format time for display
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "TBD"
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(date)
    } catch {
      return "TBD"
    }
  }

  // Group odds lines by market category for organization
  const groupOddsByMarket = (lines: OddsLine[]) => {
    const mainMarkets: Record<string, OddsLine[]> = {}
    const playerProps: Record<string, OddsLine[]> = {}

    lines.forEach(line => {
      const marketName = line.market_name || ''
      
      // Determine if it's a player prop or main market
      if (marketName.includes('Player') || line.participant) {
        if (!playerProps[marketName]) {
          playerProps[marketName] = []
        }
        playerProps[marketName].push(line)
      } else {
        if (!mainMarkets[marketName]) {
          mainMarkets[marketName] = []
        }
        mainMarkets[marketName].push(line)
      }
    })

    return { mainMarkets, playerProps }
  }

  // Handle manual refresh
  const handleRefresh = () => {
    if (eventId) {
      fetchGameDetails(eventId, true)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl">Loading game details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Game Details</h2>
          <p className="mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">Retry</Button>
        </div>
      </div>
    )
  }

  if (!gameDetails) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-muted rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
          <p className="mb-4">The requested game could not be found.</p>
          <Button asChild>
            <Link href="/games">Back to Games</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { mainMarkets, playerProps } = groupOddsByMarket(oddsLines)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/games" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">{gameDetails.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{gameDetails.competition_name || "NBA"}</Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" />
                  {formatDate(gameDetails.start)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  {formatTime(gameDetails.start)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 flex flex-col items-center">
              <div className="h-24 w-24 flex items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {gameDetails.away_team_abbreviation || gameDetails.away_team?.substring(0, 3).toUpperCase()}
              </div>
              <h3 className="mt-4 text-xl font-bold">{gameDetails.away_team}</h3>
            </div>
            
            <div className="text-3xl font-bold">VS</div>
            
            <div className="flex-1 flex flex-col items-center">
              <div className="h-24 w-24 flex items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {gameDetails.home_team_abbreviation || gameDetails.home_team?.substring(0, 3).toUpperCase()}
              </div>
              <h3 className="mt-4 text-xl font-bold">{gameDetails.home_team}</h3>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="main-markets">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main-markets">Main Markets</TabsTrigger>
          <TabsTrigger value="player-props">Player Props</TabsTrigger>
        </TabsList>
        
        <TabsContent value="main-markets" className="mt-6 space-y-6">
          {Object.keys(mainMarkets).length === 0 ? (
            <div className="bg-muted p-6 rounded-lg text-center">
              <p className="text-muted-foreground">No main market odds available for this game.</p>
            </div>
          ) : (
            Object.entries(mainMarkets).map(([market, lines]) => (
              <Card key={market}>
                <CardHeader>
                  <CardTitle>{market}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="text-right">Odds</TableHead>
                        {lines.some(line => line.line !== undefined) && 
                          <TableHead className="text-right">Line</TableHead>
                        }
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{line.outcome_name}</TableCell>
                          <TableCell className="text-right">
                            {line.price > 0 ? `+${line.price}` : line.price}
                          </TableCell>
                          {lines.some(line => line.line !== undefined) && 
                            <TableCell className="text-right">{line.line}</TableCell>
                          }
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="player-props" className="mt-6 space-y-6">
          {Object.keys(playerProps).length === 0 ? (
            <div className="bg-muted p-6 rounded-lg text-center">
              <p className="text-muted-foreground">No player props available for this game.</p>
            </div>
          ) : (
            Object.entries(playerProps).map(([market, lines]) => (
              <Card key={market}>
                <CardHeader>
                  <CardTitle>{market}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="text-right">Line</TableHead>
                        <TableHead className="text-right">Odds</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{line.participant || "Unknown"}</TableCell>
                          <TableCell>{line.outcome_name}</TableCell>
                          <TableCell className="text-right">{line.line || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            {line.price > 0 ? `+${line.price}` : line.price}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
