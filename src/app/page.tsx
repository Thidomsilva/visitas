"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays } from 'date-fns';
import { mockClients } from "@/lib/data";
import { classificationIntervals, type Client, type Visit, type VisitStatus } from "@/lib/types";
import { getVisitStatus } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatusChart } from "@/components/status-chart";
import { ClientCard } from "@/components/client-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, AlertTriangle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = "all" | VisitStatus;

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVisitLogged = (clientId: string, visit: Visit) => {
    setClients(prevClients => {
      return prevClients.map(client => {
        if (client.id === clientId) {
          const newLastVisitDate = visit.date;
          const interval = classificationIntervals[client.classification];
          const newNextVisitDate = addDays(newLastVisitDate, interval);
          return {
            ...client,
            lastVisitDate: newLastVisitDate,
            nextVisitDate: newNextVisitDate,
            visits: [visit, ...client.visits],
          };
        }
        return client;
      });
    });
  };

  const filteredClients = useMemo(() => {
    if (filter === 'all') return clients;
    return clients.filter(client => getVisitStatus(client.nextVisitDate) === filter);
  }, [clients, filter]);

  const stats = useMemo(() => {
    return clients.reduce((acc, client) => {
      const status = getVisitStatus(client.nextVisitDate);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<VisitStatus, number>);
  }, [clients]);

  const chartData = useMemo(() => {
    return [
      { status: 'on-schedule' as VisitStatus, count: stats['on-schedule'] || 0 },
      { status: 'approaching' as VisitStatus, count: stats['approaching'] || 0 },
      { status: 'overdue' as VisitStatus, count: stats['overdue'] || 0 },
      { status: 'no-visits' as VisitStatus, count: stats['no-visits'] || 0 },
    ];
  }, [stats]);
  
  if (!isMounted) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approaching Visits</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approaching || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Visits</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdue || 0}</div>
            </CardContent>
          </Card>
          <div className="lg:col-span-2 hidden lg:block">
            <StatusChart data={chartData} />
          </div>
        </div>
        
        <div className="lg:hidden">
            <StatusChart data={chartData} />
        </div>
        
        <div>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="mb-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="on-schedule">On Schedule</TabsTrigger>
              <TabsTrigger value="approaching">Approaching</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="no-visits">No Visits</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClients.map(client => (
              <ClientCard key={client.id} client={client} onVisitLogged={handleVisitLogged} />
            ))}
          </div>

          {filteredClients.length === 0 && (
             <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground bg-card rounded-lg">
                <p className="text-lg font-semibold">No clients found</p>
                <p>There are no clients matching the selected filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
     <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="lg:col-span-2 h-[290px] md:h-auto" />
        </div>
        <div>
          <Skeleton className="h-10 w-full md:w-[480px] mb-4" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[280px]" />)}
          </div>
        </div>
      </main>
    </div>
  )
}
