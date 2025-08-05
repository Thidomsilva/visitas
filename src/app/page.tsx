
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, Timestamp, getDocs, query, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Client, type Visit, type VisitStatus, ClientClassification, deserializeClient } from "@/lib/types";
import { getVisitStatus, calculateNextVisitDate, findNextBusinessDay } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Diamond, Star, CalendarClock, XCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { AddClientDialog } from "@/components/add-client-dialog";
import { ClientList } from "@/components/client-list";
import { ClientDetail } from "@/components/client-detail";
import { CalendarView } from "@/components/calendar-view";
import { AnalyticsView } from "@/components/analytics-view";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { getResponsavel } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";


type FilterType = "all" | VisitStatus | `class-${ClientClassification}` | "realizadas";
type ViewType = "dashboard" | "calendar" | "analytics";
type UnitFilterType = 'all' | 'LONDRINA' | 'CURITIBA';

function DashboardSkeleton() {
  return (
     <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader onAddClient={() => {}} onViewChange={() => {}} />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
        <main className="flex-1 p-6">
           <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
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
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState<UnitFilterType>('all');
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("dashboard");
  const { toast } = useToast();

  useEffect(() => {
    const q = collection(db, "clients");
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (querySnapshot) => {
      const clientsData = querySnapshot.docs.map(doc => {
        return deserializeClient({ id: doc.id, ...doc.data() } as Client);
      });
      
      setClients(clientsData);

      if (isLoading) setIsLoading(false);
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
  }, [toast, isLoading]);


  const clientsForStats = useMemo(() => {
    return unitFilter === 'all' ? clients : clients.filter(c => c.unit === unitFilter);
  }, [clients, unitFilter]);

  const filteredClients = useMemo(() => {
    let sortedClients = [...clientsForStats].sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      
      const statusA = getVisitStatus(a.nextVisitDate);
      const statusB = getVisitStatus(b.nextVisitDate);
      const statusOrder: Record<VisitStatus, number> = { 'overdue': 1, 'approaching': 2, 'on-schedule': 3, 'no-visits': 4 };
      if (statusOrder[statusA] < statusOrder[statusB]) return -1;
      if (statusOrder[statusA] > statusOrder[statusB]) return 1;

      const dateA = a.nextVisitDate ? a.nextVisitDate.getTime() : Infinity;
      const dateB = b.nextVisitDate ? b.nextVisitDate.getTime() : Infinity;
      return dateA - dateB;
    });

    if (filter !== 'all') {
      if (filter.startsWith('class-')) {
        const classification = filter.split('-')[1] as ClientClassification;
        sortedClients = sortedClients.filter(client => client.classification === classification);
      } else if (filter === 'realizadas') {
        sortedClients = sortedClients.filter(client => client.visits && client.visits.length > 0);
      }
      else {
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
  
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  useEffect(() => {
     if (view === 'dashboard' && !isMobile && filteredClients.length > 0 && !filteredClients.find(c => c.id === selectedClientId)) {
      setSelectedClientId(filteredClients[0].id);
    } else if (view === 'dashboard' && filteredClients.length === 0) {
      setSelectedClientId(null);
    }
  }, [filter, clients, selectedClientId, filteredClients, searchQuery, view, unitFilter, isMobile]);

  
  const handleVisitLogged = async (clientId: string, visit: Visit) => {
    const clientRef = doc(db, "clients", clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
  
    const visitDate = visit.date as Date;
    const newVisit = { ...visit, date: Timestamp.fromDate(visitDate) };
    
    const clientVisitsAsTimestamps = client.visits.map(v => {
      const vDate = v.date as Date;
      return {...v, date: Timestamp.fromDate(vDate)};
    });
  
    const updatedVisits = [newVisit, ...clientVisitsAsTimestamps]
      .sort((a,b) => (b.date as Timestamp).toMillis() - (a.date as Timestamp).toMillis());
    
    const nextVisitDate = calculateNextVisitDate(visitDate, client.classification, client.isCritical);
  
    await updateDoc(clientRef, {
      visits: updatedVisits,
      lastVisitDate: newVisit.date,
      nextVisitDate: Timestamp.fromDate(nextVisitDate),
    });
  };

  const handleScheduleMeeting = async (clientId: string, newDate: Date) => {
    const clientRef = doc(db, "clients", clientId);
    const nextBusinessDay = findNextBusinessDay(newDate);

    await updateDoc(clientRef, {
      nextVisitDate: Timestamp.fromDate(nextBusinessDay),
    });
     toast({
      title: "Reunião Agendada!",
      description: `A próxima visita para o cliente foi agendada para ${format(nextBusinessDay, 'PPP', { locale: ptBR })}.`
    })
  };

  const handleUpdateClassification = async (clientId: string, newClassification: ClientClassification) => {
    const clientRef = doc(db, "clients", clientId);
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newResponsavel = getResponsavel(client.unit, newClassification);
    const dateToRecalculateFrom = client.lastVisitDate ?? client.createdAt;
    const nextVisitDate = calculateNextVisitDate(dateToRecalculateFrom as Date, newClassification, client.isCritical);

    await updateDoc(clientRef, {
      classification: newClassification,
      responsavel: newResponsavel,
      nextVisitDate: Timestamp.fromDate(nextVisitDate),
    });

    toast({
        title: "Classificação Atualizada!",
        description: `O cliente ${client.name} agora é Classe ${newClassification}. A próxima visita foi reagendada.`,
    });
  };


  const handleAddClient = async (newClient: Omit<Client, 'id' | 'lastVisitDate' | 'nextVisitDate' | 'visits' | 'isCritical' | 'createdAt'>) => {
    const creationDate = findNextBusinessDay(new Date());
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
    let dateToCalculateFrom: Date;

    if (newCriticalStatus) {
      dateToCalculateFrom = new Date();
    } else {
      dateToCalculateFrom = client.lastVisitDate as Date || client.createdAt as Date;
    }

    const nextVisitDate = calculateNextVisitDate(dateToCalculateFrom, client.classification, newCriticalStatus);

    await updateDoc(clientRef, {
      isCritical: newCriticalStatus,
      nextVisitDate: Timestamp.fromDate(nextVisitDate),
    });
  };

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
  
  const renderDashboardContent = () => {
    // Mobile view: show either list or detail, not both
    if (isMobile && selectedClientId && selectedClient) {
      return (
        <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
          <Button variant="ghost" onClick={() => setSelectedClientId(null)} className="mb-4 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a lista
          </Button>
          <ClientDetail
            client={selectedClient}
            onVisitLogged={handleVisitLogged}
            onDeleteClient={handleDeleteClient}
            onToggleCriticalStatus={handleToggleCriticalStatus}
            onScheduleMeeting={handleScheduleMeeting}
            onUpdateClassification={handleUpdateClassification}
          />
        </main>
      );
    }
  
    return (
      <div className={cn("flex-1 flex flex-col md:flex-row overflow-hidden", (isMobile && selectedClientId) && "hidden")}>
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
        <main className="flex-1 flex-col p-4 md:p-6 overflow-y-auto hidden md:flex">
          <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
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
                <p className="text-xs text-muted-foreground">de {clientsForStats.length}</p>
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
                <p className="text-xs text-muted-foreground">de {clientsForStats.length}</p>
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
                <p className="text-xs text-muted-foreground">de {clientsForStats.length}</p>
              </CardContent>
            </Card>
            <Card
              className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'approaching' && 'ring-2 ring-primary')}
              onClick={() => handleFilterChange('approaching')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximas</CardTitle>
                <CalendarClock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats['approaching'] || 0}</div>
                <p className="text-xs text-muted-foreground">em 7 dias</p>
              </CardContent>
            </Card>
            <Card
              className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'overdue' && 'ring-2 ring-primary')}
              onClick={() => handleFilterChange('overdue')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats['overdue'] || 0}</div>
                <p className="text-xs text-muted-foreground">pendentes</p>
              </CardContent>
            </Card>
            <Card
              className={cn("cursor-pointer transition-all hover:ring-2 hover:ring-primary", filter === 'on-schedule' && 'ring-2 ring-primary')}
              onClick={() => handleFilterChange('on-schedule')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Dia</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats['on-schedule'] || 0}</div>
                <p className="text-xs text-muted-foreground">em dia</p>
              </CardContent>
            </Card>
          </div>
          <ClientDetail
            client={selectedClient}
            onVisitLogged={handleVisitLogged}
            onDeleteClient={handleDeleteClient}
            onToggleCriticalStatus={handleToggleCriticalStatus}
            onScheduleMeeting={handleScheduleMeeting}
            onUpdateClassification={handleUpdateClassification}
          />
        </main>
      </div>
    );
  };


  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return renderDashboardContent();
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
            onUpdateClassification={handleUpdateClassification}
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
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <DashboardSkeleton />;
  }

  return <DashboardPageContent />;
}
