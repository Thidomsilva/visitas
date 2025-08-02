"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Client, Visit } from '@/lib/types';

const visitSchema = z.object({
  feedback: z.string().min(10, 'O feedback deve ter pelo menos 10 caracteres.'),
  followUp: z.string().min(10, 'As ações de acompanhamento devem ter pelo menos 10 caracteres.'),
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
    },
  });

  function onSubmit(values: z.infer<typeof visitSchema>) {
    const newVisit: Visit = {
      id: crypto.randomUUID(),
      date: new Date(),
      ...values,
    };
    onVisitLogged(newVisit);
    form.reset();
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Registrar Visita para {client.name}</DialogTitle>
          <DialogDescription>
            Registre os detalhes de sua interação recente. A data da visita é definida automaticamente como hoje.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
