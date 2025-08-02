
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, Timestamp, getDocs, query, setDoc, writeBatch, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { classificationIntervals, type Client, type Visit, type VisitStatus, ClientClassification } from "@/lib/types";
import { getVisitStatus } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Diamond, Star, CalendarClock, XCircle, CheckCircle2, Database } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { AddClientDialog } from "@/components/add-client-dialog";
import { ClientList } from "@/components/client-list";
import { ClientDetail } from "@/components/client-detail";
import { CalendarView } from "@/components/calendar-view";
import { AnalyticsView } from "@/components/analytics-view";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { getInitialClientsForSeed } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type FilterType = "all" | VisitStatus | `class-${ClientClassification}`;
type ViewType = "dashboard" | "calendar" | "analytics";
type UnitFilterType = 'all' | 'LONDRINA' | 'CURITIBA';

function deserializeClient(client: Client): Client {
  const toDate = (timestamp: any) => timestamp instanceof Timestamp ? timestamp.toDate() : (timestamp ? new Date(timestamp) : null);
  return {
    ...client,
    lastVisitDate: toDate(client.lastVisitDate),
    nextVisitDate: toDate(client.nextVisitDate),
    createdAt: toDate(client.createdAt),
    visits: client.visits.map(v => ({ ...v, date: toDate(v.date) })),
  };
}

const calculateNextVisitDate = (lastVisit: Date, classification: ClientClassification, isCritical?: boolean): Date => {
    const criticalInterval = { min: 7, max: 7 };
    const interval = isCritical ? criticalInterval : classificationIntervals[classification];
    const daysToAdd = Math.floor(Math.random() * (interval.max - interval.min + 1)) + interval.min;
    let nextDate = addDays(lastVisit, daysToAdd);
    return nextDate;
  };

function DashboardSkeleton() {
  return (
     <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader onAddClient={() => {}} onViewChange={() => {}} onSeedDatabase={() => {}} isSeeding={false} view="dashboard"/>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
        <main className="flex-1 p-6">
           <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6 mb-6">
              <Skeleton className="h-[108px]" />
              <Skeleton className="h-[108px]" />
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

function DashboardPageContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState<UnitFilterType>('all');
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("dashboard");
  const { toast } = useToast();

  useEffect(() => {
    const q = collection(db, "clients");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.metadata.hasPendingWrites) {
        return;
      }
      const clientsData = querySnapshot.docs.map(doc => deserializeClient({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
        console.error("Erro ao buscar clientes: ", error);
        toast({
            title: "Erro de Conexão",
            description: "Não foi possível conectar ao banco de dados. Verifique as regras de segurança do Firestore.",
            variant: "destructive"
        })
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    toast({ title: "Iniciando processo...", description: "Limpando o banco de dados e preparando para popular. Isso pode levar alguns instantes." });

    try {
        // 1. Deletar todos os clientes existentes
        const clientsCollectionRef = collection(db, "clients");
        const existingClientsSnapshot = await getDocs(query(clientsCollectionRef));
        if (!existingClientsSnapshot.empty) {
            const deleteBatch = writeBatch(db);
            existingClientsSnapshot.docs.forEach(doc => {
                deleteBatch.delete(doc.ref);
            });
            await deleteBatch.commit();
            toast({ title: "Banco de dados limpo", description: "Clientes anteriores foram removidos com sucesso." });
        }
        
        // Aguardar um pouco para garantir que o onSnapshot processe a deleção
        await new Promise(resolve => setTimeout(resolve, 1000));


        // 2. Popular com os novos dados, agendando apenas a primeira visita
        const initialClients = getInitialClientsForSeed();
        let clientsAddedCount = 0;

        for (const clientData of initialClients) {
            const creationDate = clientData.createdAt ? (clientData.createdAt as Date) : new Date();
            
            // Calcula apenas a primeira visita a partir da data de criação
            const nextVisitDate = calculateNextVisitDate(creationDate, clientData.classification, clientData.isCritical);

            const clientToAdd = {
                ...clientData,
                createdAt: Timestamp.fromDate(creationDate),
                lastVisitDate: null, // Começa sem visita anterior
                nextVisitDate: Timestamp.fromDate(nextVisitDate),
                visits: [], // Começa com histórico de visitas vazio
            };
            
            await addDoc(clientsCollectionRef, clientToAdd);
            clientsAddedCount++;
        }

        if (clientsAddedCount > 0) {
            toast({
                title: "Sucesso!",
                description: `${clientsAddedCount} clientes foram cadastrados e a primeira visita de cada um foi agendada.`,
            });
        } else {
             toast({
                title: "Banco de dados limpo!",
                description: "O sistema está pronto para receber novos clientes.",
            });
        }

    } catch (error) {
        console.error("Erro ao popular banco de dados:", error);
        toast({
            title: "Erro ao Popular Banco de Dados",
            description: "Ocorreu um erro ao cadastrar os clientes iniciais. Verifique o console para mais detalhes.",
            variant: "destructive"
        });
    } finally {
        setIsSeeding(false);
    }
  };


  const clientsForStats = useMemo(() => {
    return unitFilter === 'all' ? clients : clients.filter(c => c.unit === unitFilter);
  }, [clients, unitFilter]);

  const filteredClients = useMemo(() => {
    let sortedClients = [...clientsForStats].sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;

      const statusA = getVisitStatus(a.nextVisitDate as Date | null);
      const statusB = getVisitStatus(b.nextVisitDate as Date | null);

      if (statusA === 'overdue' && statusB !== 'overdue') return -1;
      if (statusB === 'overdue' && statusA !== 'overdue') return 1;
      if (statusA === 'approaching' && statusB !== 'approaching') return -1;
      if (statusB === 'approaching' && statusA !== 'approaching') return 1;

      const dateA = a.nextVisitDate ? (a.nextVisitDate as Date).getTime() : Infinity;
      const dateB = b.nextVisitDate ? (b.nextVisitDate as Date).getTime() : Infinity;
      
      return dateA - dateB;
    });

    if (filter !== 'all') {
      if (filter.startsWith('class-')) {
        const classification = filter.split('-')[1] as ClientClassification;
        sortedClients = sortedClients.filter(client => client.classification === classification);
      } else {
        sortedClients = sortedClients.filter(client => getVisitStatus(client.nextVisitDate as Date | null) === filter);
      }
    }
    
    if (searchQuery) {
        sortedClients = sortedClients.filter(client => 
            client.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return sortedClients;
  }, [clientsForStats, filter, searchQuery]);
  
  useEffect(() => {
     if (view === 'dashboard' && filteredClients.length > 0 && !filteredClients.find(c => c.id === selectedClientId)) {
      setSelectedClientId(filteredClients[0].id);
    } else if (view === 'dashboard' && filteredClients.length === 0) {
      setSelectedClientId(null);
    }
  }, [filter, clients, selectedClientId, filteredClients, searchQuery, view, unitFilter]);

  
  const handleVisitLogged = async (clientId: string, visit: Visit) => {
    const clientRef = doc(db, "clients", clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newVisit = { ...visit, date: Timestamp.fromDate(visit.date as Date) };
    const updatedVisits = [newVisit, ...client.visits.map(v => ({...v, date: Timestamp.fromDate(v.date as Date)}))].sort((a,b) => (b.date as Timestamp).toMillis() - (a.date as Timestamp).toMillis());
    
    const nextVisitDate = calculateNextVisitDate(visit.date as Date, client.classification, client.isCritical);

    await updateDoc(clientRef, {
      visits: updatedVisits,
      lastVisitDate: newVisit.date,
      nextVisitDate: Timestamp.fromDate(nextVisitDate),
    });
  };

  const handleScheduleMeeting = async (clientId: string, newDate: Date) => {
    const clientRef = doc(db, "clients", clientId);
    await updateDoc(clientRef, {
      nextVisitDate: Timestamp.fromDate(newDate),
    });
     toast({
      title: "Reunião Agendada!",
      description: `A próxima visita para o cliente foi agendada para ${format(newDate, 'PPP', { locale: ptBR })}.`
    })
  };


  const handleAddClient = async (newClient: Omit<Client, 'id' | 'lastVisitDate' | 'nextVisitDate' | 'visits' | 'isCritical' | 'createdAt'>) => {
    const creationDate = new Date();
    const nextVisitDate = calculateNextVisitDate(creationDate, newClient.classification, false);

    const clientToAdd = {
      ...newClient,
      lastVisitDate: null,
      nextVisitDate: Timestamp.fromDate(nextVisitDate),
      visits: [],
      isCritical: false,
      createdAt: Timestamp.fromDate(creationDate)
    };
    
    const docRef = await addDoc(collection(db, "clients"), clientToAdd);
    setSelectedClientId(docRef.id);
  }

  const handleDeleteClient = async (clientId: string) => {
    await deleteDoc(doc(db, "clients", clientId));
    if (selectedClientId === clientId) {
      setSelectedClientId(filteredClients.length > 0 ? filteredClients[0].id : null);
    }
  }

  const handleToggleCriticalStatus = async (clientId: string) => {
    const clientRef = doc(db, "clients", clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newCriticalStatus = !client.isCritical;
    const lastVisit = (client.lastVisitDate || client.createdAt) as Date;
    const nextVisitDate = calculateNextVisitDate(lastVisit, client.classification, newCriticalStatus);

    await updateDoc(clientRef, {
      isCritical: newCriticalStatus,
      nextVisitDate: Timestamp.fromDate(nextVisitDate),
    });
  }

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => c.id === selectedClientId) || null;
  }, [selectedClientId, clients]);

  const stats = useMemo(() => {
    return clientsForStats.reduce((acc, client) => {
      const status = getVisitStatus(client.nextVisitDate as Date | null);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<VisitStatus, number>);
  }, [clientsForStats]);

  const classificationStats = useMemo(() => {
    return clientsForStats.reduce((acc, client) => {
      if (!acc[client.classification]) {
        acc[client.classification] = 0;
      }
      acc[client.classification]++;
      return acc;
    }, {} as Record<ClientClassification, number>);
  }, [clientsForStats]);
  
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(currentFilter => currentFilter === newFilter ? 'all' : newFilter);
  };
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return (
          <div className="flex-1 flex overflow-hidden">
            <ClientList
              clients={filteredClients}
              selectedClientId={selectedClientId}
              onSelectClient={setSelectedClientId}
              filter={filter}
              onFilterChange={(value) => setFilter(value as FilterType)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              unitFilter={unitFilter}
              onUnitFilterChange={setUnitFilter}
            />
            <main className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6 mb-6">
                <Card
                  className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-A' && 'ring-2 ring-primary')}
                  onClick={() => handleFilterChange('class-A')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Classe A</CardTitle>
                    <Gem className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classificationStats['A'] || 0}</div>
                    <p className="text-xs text-muted-foreground">do total de {clientsForStats.length}</p>
                  </CardContent>
                </Card>
                <Card
                  className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-B' && 'ring-2 ring-primary')}
                  onClick={() => handleFilterChange('class-B')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Classe B</CardTitle>
                    <Diamond className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classificationStats['B'] || 0}</div>
                    <p className="text-xs text-muted-foreground">do total de {clientsForStats.length}</p>
                  </CardContent>
                </Card>
                <Card
                  className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'class-C' && 'ring-2 ring-primary')}
                  onClick={() => handleFilterChange('class-C')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Classe C</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classificationStats['C'] || 0}</div>
                    <p className="text-xs text-muted-foreground">do total de {clientsForStats.length}</p>
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
                    <p className="text-xs text-muted-foreground">próximos 7 dias</p>
                  </CardContent>
                </Card>
                <Card
                  className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'overdue' && 'ring-2 ring-primary')}
                  onClick={() => handleFilterChange('overdue')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Visitas Atrasadas</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats['overdue'] || 0}</div>
                    <p className="text-xs text-muted-foreground">clientes pendentes</p>
                  </CardContent>
                </Card>
                <Card
                  className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'on-schedule' && 'ring-2 ring-primary')}
                  onClick={() => handleFilterChange('on-schedule')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Visitas em Dia</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats['on-schedule'] || 0}</div>
                    <p className="text-xs text-muted-foreground">clientes em dia</p>
                  </CardContent>
                </Card>
              </div>
              <ClientDetail
                client={selectedClient}
                onVisitLogged={handleVisitLogged}
                onDeleteClient={handleDeleteClient}
                onToggleCriticalStatus={handleToggleCriticalStatus}
                onScheduleMeeting={handleScheduleMeeting}
              />
            </main>
          </div>
        );
      case 'calendar':
        return (
          <CalendarView
            clients={clientsForStats}
            onClientClick={(clientId) => {
                setView('dashboard');
                setSelectedClientId(clientId);
            }}
            selectedClientId={selectedClientId}
            onVisitLogged={handleVisitLogged}
            onDeleteClient={handleDeleteClient}
            onToggleCriticalStatus={handleToggleCriticalStatus}
            onScheduleMeeting={handleScheduleMeeting}
          />
        );
      case 'analytics':
        return <AnalyticsView clients={clientsForStats} />;
      default:
        return null;
    }
  };
  
  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardHeader 
            onAddClient={() => setAddClientOpen(true)}
            view={view}
            onViewChange={setView}
            onSeedDatabase={handleSeedDatabase}
            isSeeding={isSeeding}
        />
        {renderView()}
      </div>
      <AddClientDialog 
        open={isAddClientOpen}
        onOpenChange={setAddClientOpen}
        onClientAdded={handleAddClient}
      />
    </>
  );
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <DashboardSkeleton />;
  }

  return <DashboardPageContent />;
}

    