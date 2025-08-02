
'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client, ClientClassification, VisitStatus } from '@/lib/types';
import { getVisitStatus } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface AnalyticsViewProps {
  clients: Client[];
}

const chartConfig = {
  visits: { label: 'Visitas' },
  A: { label: 'Classe A', color: 'hsl(var(--chart-1))' },
  B: { label: 'Classe B', color: 'hsl(var(--chart-2))' },
  C: { label: 'Classe C', color: 'hsl(var(--chart-3))' },
  'on-schedule': { label: 'Em Dia', color: 'hsl(var(--chart-2))' },
  approaching: { label: 'Próximas', color: 'hsl(var(--chart-4))' },
  overdue: { label: 'Atrasadas', color: 'hsl(var(--chart-5))' },
};

export function AnalyticsView({ clients }: AnalyticsViewProps) {
  const visitsByMonth = useMemo(() => {
    const monthCounts: { [key: string]: number } = {};
    clients.forEach(client => {
      client.visits.forEach(visit => {
        const month = format(new Date(visit.date), 'yyyy-MM');
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
    });

    return Object.entries(monthCounts)
      .map(([month, count]) => ({
        month: format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR }),
        visits: count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [clients]);

  const clientsByResponsavel = useMemo(() => {
    const responsavelData: { [key: string]: { name: string; A: number; B: number; C: number } } = {};
    clients.forEach(client => {
      const { responsavel, classification } = client;
      if (!responsavelData[responsavel]) {
        responsavelData[responsavel] = { name: responsavel, A: 0, B: 0, C: 0 };
      }
      responsavelData[responsavel][classification]++;
    });
    return Object.values(responsavelData);
  }, [clients]);

  const visitStatusByResponsavel = useMemo(() => {
    const responsavelData: { [key: string]: { name: string; 'on-schedule': number; approaching: number; overdue: number } } = {};
    clients.forEach(client => {
      const { responsavel } = client;
      const status = getVisitStatus(client.nextVisitDate);
      if (status !== 'no-visits') {
         if (!responsavelData[responsavel]) {
            responsavelData[responsavel] = { name: responsavel, 'on-schedule': 0, approaching: 0, overdue: 0 };
        }
        responsavelData[responsavel][status]++;
      }
    });
    return Object.values(responsavelData);
  }, [clients]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Visitas por Mês</CardTitle>
          <CardDescription>Volume de visitas agendadas para os próximos meses.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={visitsByMonth} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="visits" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clientes por Responsável</CardTitle>
            <CardDescription>Distribuição da carteira de clientes por classe.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={clientsByResponsavel} layout="vertical" accessibilityLayer>
                <CartesianGrid horizontal={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} />
                <XAxis type="number" dataKey="A" hide/>
                <Tooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="A" stackId="a" fill="var(--color-A)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="B" stackId="a" fill="var(--color-B)" />
                <Bar dataKey="C" stackId="a" fill="var(--color-C)" radius={[4, 0, 0, 4]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status das Visitas por Responsável</CardTitle>
            <CardDescription>Performance do cronograma de visitas da equipe.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={visitStatusByResponsavel} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                    <YAxis />
                    <Tooltip cursor={false} content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="on-schedule" fill="var(--color-on-schedule)" radius={4} />
                    <Bar dataKey="approaching" fill="var(--color-approaching)" radius={4} />
                    <Bar dataKey="overdue" fill="var(--color-overdue)" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
