
"use client";

import { useState, useMemo, useEffect } from "react";
import { addDays } from 'date-fns';
import { initialClients } from "@/lib/data";
import { classificationIntervals, type Client, type Visit, type VisitStatus, ClientClassification } from "@/lib/types";
import { getVisitStatus } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Diamond, Star, CalendarClock } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { AddClientDialog } from "@/components/add-client-dialog";
import { ClientList } from "@/components/client-list";
import { ClientDetail } from "@/components/client-detail";
import { generateSchedule } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

type FilterType = "all" | VisitStatus | `class-${ClientClassification}`;

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>(() => generateSchedule(initialClients));
  const [filter, setFilter] = useState<FilterType>("all");
  const [isMounted, setIsMounted] = useState(false);
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const sortedClients = [...clients].sort((a, b) => {
      // Critical clients on top
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;

      const statusA = getVisitStatus(a.nextVisitDate);
      const statusB = getVisitStatus(b.nextVisitDate);

      if (statusA === 'overdue' && statusB !== 'overdue') return -1;
      if (statusB === 'overdue' && statusA !== 'overdue') return 1;

      if (statusA === 'approaching' && statusB !== 'approaching') return -1;
      if (statusB === 'approaching' && statusA !== 'approaching') return 1;

      if (a.nextVisitDate === null) return 1;
      if (b.nextVisitDate === null) return -1;

      if(a.nextVisitDate && b.nextVisitDate) {
        return a.nextVisitDate.getTime() - b.nextVisitDate.getTime();
      }
      return 0;
    });
    
    if (filter === 'all') return sortedClients;

    if (filter.startsWith('class-')) {
      const classification = filter.split('-')[1] as ClientClassification;
      return sortedClients.filter(client => client.classification === classification);
    }
    
    return sortedClients.filter(client => getVisitStatus(client.nextVisitDate) === filter);
  }, [clients, filter]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && filteredClients.length > 0 && !selectedClientId) {
      setSelectedClientId(filteredClients[0].id);
    }
  }, [isMounted, filteredClients, selectedClientId]);


  useEffect(() => {
    if (filteredClients.length > 0 && !filteredClients.find(c => c.id === selectedClientId)) {
      setSelectedClientId(filteredClients[0].id);
    } else if (filteredClients.length === 0) {
      setSelectedClientId(null);
    }
  }, [filter, clients, selectedClientId, filteredClients]);
  

  const handleVisitLogged = (clientId: string, visit: Visit) => {
    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return prevClients;
  
      const updatedClients = [...prevClients];
      const clientToUpdate = { ...updatedClients[clientIndex] };
  
      // Add the new visit and sort
      const sortedVisits = [visit, ...clientToUpdate.visits].sort((a,b) => b.date.getTime() - a.date.getTime());
      
      clientToUpdate.visits = sortedVisits;
      clientToUpdate.lastVisitDate = visit.date;

      // Regenerate the rest of the schedule from this point
      const regeneratedSchedule = generateSchedule(updatedClients, clientIndex);
  
      return regeneratedSchedule;
    });
  };

  const handleAddClient = (newClient: Omit<Client, 'id' | 'lastVisitDate' | 'nextVisitDate' | 'visits'>) => {
    const clientToAdd: Client = {
      ...newClient,
      id: crypto.randomUUID(),
      lastVisitDate: null,
      nextVisitDate: null,
      visits: [],
      isCritical: false,
    };
    const newClients = [clientToAdd, ...clients];
    // We need to regenerate the schedule with the new client
    const scheduledClients = generateSchedule(newClients);
    setClients(scheduledClients);
    setSelectedClientId(clientToAdd.id);
  }

  const handleDeleteClient = (clientId: string) => {
    setClients(prev => {
      const newClients = prev.filter(client => client.id !== clientId);
      // Regenerate schedule after deleting
      const scheduledClients = generateSchedule(newClients);
       if (selectedClientId === clientId) {
        setSelectedClientId(scheduledClients.length > 0 ? scheduledClients[0].id : null);
      }
      return scheduledClients;
    });
  }

  const handleToggleCriticalStatus = (clientId: string) => {
    setClients(prevClients => {
      const clientIndex = prevClients.findIndex(c => c.id === clientId);
      if (clientIndex === -1) return prevClients;

      const updatedClients = [...prevClients];
      const clientToUpdate = { ...updatedClients[clientIndex] };
      
      clientToUpdate.isCritical = !clientToUpdate.isCritical;
      // Define a fake last visit date to force rescheduling from today
      clientToUpdate.lastVisitDate = new Date();

      const regeneratedSchedule = generateSchedule(updatedClients, clientIndex);

      return regeneratedSchedule;
    })
  }

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => c.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

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
  
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(currentFilter => currentFilter === newFilter ? 'all' : newFilter);
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardHeader onAddClient={() => setAddClientOpen(true)} />
        <div className="flex-1 flex overflow-hidden">
            <ClientList
              clients={filteredClients}
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
              filter={filter}
              onFilterChange={(value) => setFilter(value as FilterType)}
            />
          <main className="flex-1 flex flex-col p-6 overflow-y-auto">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-A' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('class-A')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Classe A</CardTitle>
                  <Gem className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classificationStats['A'] || 0}</div>
                  <p className="text-xs text-muted-foreground">do total de {clients.length} clientes</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-B' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('class-B')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Classe B</CardTitle>
                  <Diamond className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classificationStats['B'] || 0}</div>
                   <p className="text-xs text-muted-foreground">do total de {clients.length} clientes</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-C' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('class-C')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Classe C</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classificationStats['C'] || 0}</div>
                   <p className="text-xs text-muted-foreground">do total de {clients.length} clientes</p>
                </CardContent>
              </Card>
              <Card
                className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'approaching' && 'ring-2 ring-primary')}
                onClick={() => handleFilterChange('approaching')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visitas Próximas</CardTitle>
                  <CalendarClock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats['approaching'] || 0}</div>
                   <p className="text-xs text-muted-foreground">nos próximos 7 dias</p>
                </CardContent>
              </Card>
            </div>
            
            <ClientDetail
              client={selectedClient}
              onVisitLogged={handleVisitLogged}
              onDeleteClient={handleDeleteClient}
              onToggleCriticalStatus={handleToggleCriticalStatus}
            />

          </main>
        </div>
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
     <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader onAddClient={() => {}}/>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
        <main className="flex-1 p-6">
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
            </div>
          <Skeleton className="h-[500px]" />
        </main>
      </div>
    </div>
  )
}

    