
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Client, Visit } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from './ui/input';
import { useEffect } from 'react';

const visitSchema = z.object({
  feedback: z.string().min(10, 'O feedback deve ter pelo menos 10 caracteres.'),
  followUp: z.string().min(10, 'As ações de acompanhamento devem ter pelo menos 10 caracteres.'),
  date: z.date({
    required_error: "A data da visita é obrigatória.",
  }),
  registeredBy: z.string().min(2, "O nome do responsável é obrigatório."),
});

interface VisitLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onVisitLogged: (visit: Visit) => void;
}

export function VisitLogDialog({ open, onOpenChange, client, onVisitLogged }: VisitLogDialogProps) {
  const form = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      feedback: '',
      followUp: '',
      date: new Date(),
      registeredBy: client.responsavel || ''
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        feedback: '',
        followUp: '',
        date: new Date(),
        registeredBy: client.responsavel || ''
      });
    }
  }, [client, open, form]);


  function onSubmit(values: z.infer<typeof visitSchema>) {
    const newVisit: Visit = {
      id: crypto.randomUUID(),
      date: values.date,
      feedback: values.feedback,
      followUp: values.followUp,
      registeredBy: values.registeredBy,
    };
    onVisitLogged(newVisit);
    form.reset();
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            form.reset();
        }
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Registrar Visita para {client.name}</DialogTitle>
          <DialogDescription>
            Registre os detalhes de sua interação. Você pode selecionar uma data passada para o registro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Visita</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="registeredBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registrado por</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do responsável pelo registro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback / Resumo</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o resumo da visita..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="followUp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ações de Acompanhamento</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Quais são os próximos passos?" {...field} rows={4}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Salvar Visita</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
