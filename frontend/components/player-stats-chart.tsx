"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function PlayerStatsChart({ player, gameHistory }) {
  // Transform game history data for the chart
  const chartData = gameHistory
    .map((game) => ({
      date: game.date,
      points: game.points,
      rebounds: game.rebounds,
      assists: game.assists,
    }))
    .reverse()

  return (
    <ChartContainer
      config={{
        points: {
          label: "Points",
          color: "hsl(var(--chart-1))",
        },
        rebounds: {
          label: "Rebounds",
          color: "hsl(var(--chart-2))",
        },
        assists: {
          label: "Assists",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line type="monotone" dataKey="points" stroke="var(--color-points)" strokeWidth={2} />
          <Line type="monotone" dataKey="rebounds" stroke="var(--color-rebounds)" strokeWidth={2} />
          <Line type="monotone" dataKey="assists" stroke="var(--color-assists)" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
