"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { VisitStatus } from "@/lib/types";

interface StatusChartProps {
  data: { status: VisitStatus; count: number }[];
  className?: string;
}

const chartConfig = {
  count: {
    label: "Clientes",
  },
  'on-schedule': {
    label: "Em Dia",
    color: "hsl(var(--chart-2))",
  },
  'approaching': {
    label: "Próxima",
    color: "hsl(var(--accent))",
  },
  'overdue': {
    label: "Atrasada",
    color: "hsl(var(--destructive))",
  },
  'no-visits': {
    label: "Sem Visitas",
    color: "hsl(var(--muted))",
  },
} satisfies import("./ui/chart").ChartConfig;

export function StatusChart({ data, className }: StatusChartProps) {
  const chartData = data.map(item => ({...item, fill: chartConfig[item.status].color, name: chartConfig[item.status].label}));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Status das Visitas</CardTitle>
        <CardDescription>Distribuição de clientes por status de visita</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 12)}
              className="text-xs"
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="count" layout="vertical" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
