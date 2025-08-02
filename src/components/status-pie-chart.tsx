"use client"

import { Pie, PieChart } from "recharts"

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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { VisitStatus } from "@/lib/types";

interface StatusPieChartProps {
  data: { status: VisitStatus; count: number; name: string }[];
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
    color: "hsl(var(--muted-foreground))",
  },
} satisfies import("./ui/chart").ChartConfig;

export function StatusPieChart({ data, className }: StatusPieChartProps) {
  const chartData = data.map(item => ({...item, fill: chartConfig[item.status].color }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Visão Geral</CardTitle>
        <CardDescription>Distribuição percentual dos status de visita.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            />
             <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-[2px] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
