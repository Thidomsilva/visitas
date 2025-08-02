"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays } from 'date-fns';
import { initialClients } from "@/lib/data";
import { classificationIntervals, type Client, type Visit, type VisitStatus, ClientClassification } from "@/lib/types";
import { getVisitStatus } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { ClientTable } from "@/components/client-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, Diamond, Gem, CalendarClock } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { AddClientDialog } from "@/components/add-client-dialog";

type FilterType = "all" | VisitStatus;

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isMounted, setIsMounted] = useState(false);
  const [isAddClientOpen, setAddClientOpen] = useState(false);

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

  const handleAddClient = (newClient: Omit<Client, 'id' | 'lastVisitDate' | 'nextVisitDate' | 'visits'>) => {
    const clientToAdd: Client = {
      ...newClient,
      id: crypto.randomUUID(),
      lastVisitDate: null,
      nextVisitDate: null,
      visits: [],
    };
    setClients(prev => [clientToAdd, ...prev]);
  }

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  }

  const filteredClients = useMemo(() => {
    const sortedClients = [...clients].sort((a, b) => {
      if (getVisitStatus(a.nextVisitDate) === 'overdue') return -1;
      if (getVisitStatus(b.nextVisitDate) === 'overdue') return 1;
      if (a.nextVisitDate === null) return 1;
      if (b.nextVisitDate === null) return -1;
      return a.nextVisitDate.getTime() - b.nextVisitDate.getTime();
    });
    
    if (filter === 'all') return sortedClients;
    return sortedClients.filter(client => getVisitStatus(client.nextVisitDate) === filter);
  }, [clients, filter]);

  const stats = useMemo(() => {
    return clients.reduce((acc, client) => {
      const status = getVisitStatus(client.nextVisitDate);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<VisitStatus, number>);
  }, [clients]);

  const classificationStats = useMemo(() => {
    return clients.reduce((acc, client) => {
      if (!acc[client.classification]) {
        acc[client.classification] = 0;
      }
      acc[client.classification]++;
      return acc;
    }, {} as Record<ClientClassification, number>);
  }, [clients]);
  
  if (!isMounted) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <DashboardHeader onAddClient={() => setAddClientOpen(true)} />
        <main className="container py-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Classe A</CardTitle>
                <Gem className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classificationStats['A'] || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Classe B</CardTitle>
                <Diamond className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classificationStats['B'] || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Classe C</CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classificationStats['C'] || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas Próximas</CardTitle>
                <CalendarClock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats['approaching'] || 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-4">
              <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)} className="mb-4">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="on-schedule">Em Dia</TabsTrigger>
                  <TabsTrigger value="approaching">Próximas</TabsTrigger>
                  <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
                  <TabsTrigger value="no-visits">Sem Visitas</TabsTrigger>
                </TabsList>
              </Tabs>
              <Card>
                <ClientTable 
                  clients={filteredClients} 
                  onVisitLogged={handleVisitLogged} 
                  onDeleteClient={handleDeleteClient}
                />
              </Card>
            </div>
            <div className="hidden md:block space-y-6">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{clients.length}</div>
                    <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
                  </CardContent>
                </Card>
            </div>
          </div>
        </main>
      </div>
      <AddClientDialog 
        open={isAddClientOpen}
        onOpenChange={setAddClientOpen}
        onClientAdded={handleAddClient}
      />
    </>
  );
}

function DashboardSkeleton() {
  return (
     <div className="min-h-screen bg-background">
      <DashboardHeader onAddClient={() => {}}/>
      <main className="container py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
          <Skeleton className="h-[108px]" />
        </div>
         <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-4">
              <Skeleton className="h-10 w-full md:w-[480px] mb-4" />
              <Skeleton className="h-[400px]" />
            </div>
            <div className="hidden md:block space-y-6">
              <Skeleton className="h-[108px]" />
            </div>
        </div>
      </main>
    </div>
  )
}
