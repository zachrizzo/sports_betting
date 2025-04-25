"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"

// Mock data for the chart
const data = [
  { date: "Nov 1", balance: 1000, winnings: 0, bets: 0 },
  { date: "Nov 2", balance: 950, winnings: 0, bets: 1 },
  { date: "Nov 3", balance: 850, winnings: 0, bets: 2 },
  { date: "Nov 4", balance: 950, winnings: 100, bets: 3 },
  { date: "Nov 5", balance: 1050, winnings: 200, bets: 4 },
  { date: "Nov 6", balance: 975, winnings: 200, bets: 5 },
  { date: "Nov 7", balance: 1100, winnings: 325, bets: 6 },
  { date: "Nov 8", balance: 1050, winnings: 325, bets: 7 },
  { date: "Nov 9", balance: 1150, winnings: 425, bets: 8 },
  { date: "Nov 10", balance: 1050, winnings: 425, bets: 9 },
  { date: "Nov 11", balance: 1150, winnings: 525, bets: 10 },
  { date: "Nov 12", balance: 1250, winnings: 625, bets: 11 },
]

export default function UserStatsChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          activeDot={{ r: 8 }}
          name="Account Balance"
        />
        <Line type="monotone" dataKey="winnings" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Net Winnings" />
      </LineChart>
    </ResponsiveContainer>
  )
}
