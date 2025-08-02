
'use client';

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, LabelList } from 'recharts';
import { format, parseISO, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client, ClientClassification, VisitStatus } from '@/lib/types';
import { getVisitStatus } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { AnalyticsClientListDialog } from './analytics-client-list-dialog';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogClients, setDialogClients] = useState<Client[]>([]);

  const openDialog = (title: string, clients: Client[]) => {
    setDialogTitle(title);
    setDialogClients(clients);
    setDialogOpen(true);
  };

  const handleVisitsByMonthClick = (data: any) => {
    if (!data) return;
    const clickedMonth = data.activePayload[0].payload.month; // "Ago/25"
    const [monthStr, yearStr] = clickedMonth.split('/');
    const monthIndex = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].indexOf(monthStr.toLowerCase());
    const year = 2000 + parseInt(yearStr);

    const filteredClients = clients.filter(client => {
      return client.visits.some(visit => {
        const visitDate = new Date(visit.date);
        return getMonth(visitDate) === monthIndex && getYear(visitDate) === year;
      });
    });
    
    openDialog(`Clientes com Visitas em ${data.activeLabel}`, filteredClients);
  };

  const handleClientsByResponsavelClick = (data: any) => {
    if(!data) return;
    const responsavel = data.activePayload[0].payload.name;
    const classification = data.activePayload[0].dataKey as ClientClassification;
    
    const filteredClients = clients.filter(c => c.responsavel === responsavel && c.classification === classification);

    openDialog(`Clientes Classe ${classification} de ${responsavel}`, filteredClients);
  }

  const handleVisitStatusByResponsavelClick = (data: any) => {
    if(!data) return;
    const responsavel = data.activeLabel;
    const status = data.activePayload[0].dataKey as VisitStatus;
    const statusLabel = chartConfig[status].label;

    const filteredClients = clients.filter(c => 
      c.responsavel === responsavel && getVisitStatus(c.nextVisitDate) === status
    );
    
    openDialog(`Visitas ${statusLabel} de ${responsavel}`, filteredClients);
  }

  const visitsByMonth = useMemo(() => {
    const monthCounts: { [key: string]: number } = {};
    clients.forEach(client => {
      client.visits.forEach(visit => {
        const month = format(new Date(visit.date), 'yyyy-MM');
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });
    });

    return Object.entries(monthCounts)
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([month, count]) => ({
        month: format(parseISO(`${month}-01`), 'MMM/yy', { locale: ptBR }),
        visits: count,
      }));
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
    <>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>Visitas por Mês</CardTitle>
            <CardDescription>Volume de visitas agendadas para os próximos meses.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={visitsByMonth} accessibilityLayer onClick={handleVisitsByMonthClick}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={4} className="cursor-pointer">
                  <LabelList position="top" offset={5} className="fill-foreground text-xs" />
                </Bar>
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
                <BarChart data={clientsByResponsavel} layout="vertical" accessibilityLayer onClick={handleClientsByResponsavelClick}>
                  <CartesianGrid horizontal={false} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80}/>
                  <XAxis type="number" dataKey="A" hide/>
                  <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="A" stackId="a" fill="var(--color-A)" radius={[0, 4, 4, 0]} className="cursor-pointer">
                    <LabelList position="insideRight" offset={8} className="fill-white text-xs" />
                  </Bar>
                  <Bar dataKey="B" stackId="a" fill="var(--color-B)" className="cursor-pointer">
                    <LabelList position="insideRight" offset={8} className="fill-white text-xs" />
                  </Bar>
                  <Bar dataKey="C" stackId="a" fill="var(--color-C)" radius={[0, 4, 4, 0]} className="cursor-pointer">
                    <LabelList position="insideRight" offset={8} className="fill-white text-xs" />
                  </Bar>
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
                  <BarChart data={visitStatusByResponsavel} accessibilityLayer onClick={handleVisitStatusByResponsavelClick}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis />
                      <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="on-schedule" fill="var(--color-on-schedule)" radius={4} className="cursor-pointer">
                        <LabelList position="top" offset={5} className="fill-foreground text-xs" />
                      </Bar>
                      <Bar dataKey="approaching" fill="var(--color-approaching)" radius={4} className="cursor-pointer">
                          <LabelList position="top" offset={5} className="fill-foreground text-xs" />
                      </Bar>
                      <Bar dataKey="overdue" fill="var(--color-overdue)" radius={4} className="cursor-pointer">
                          <LabelList position="top" offset={5} className="fill-foreground text-xs" />
                      </Bar>
                  </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      <AnalyticsClientListDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        clients={dialogClients}
      />
    </>
  );
}
