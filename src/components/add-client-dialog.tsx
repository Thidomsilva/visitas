"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Client, ClientClassification } from '@/lib/types';
import { getResponsavel } from '@/lib/data';

const clientSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  unit: z.enum(['LONDRINA', 'CURITIBA'], {
    errorMap: () => ({ message: "Selecione uma unidade" })
  }),
  classification: z.enum(['A', 'B', 'C'], {
    errorMap: () => ({ message: "Selecione uma classificação" })
  }),
});

type NewClientForm = Omit<Client, 'id' | 'lastVisitDate' | 'nextVisitDate' | 'visits' | 'isCritical' | 'responsavel' | 'createdAt'>;

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: (client: Omit<Client, 'id' | 'lastVisitDate' | 'nextVisitDate' | 'visits' | 'isCritical' | 'createdAt'>) => void;
}

export function AddClientDialog({ open, onOpenChange, onClientAdded }: AddClientDialogProps) {
  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      unit: undefined,
      classification: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof clientSchema>) {
    const responsavel = getResponsavel(values.unit, values.classification as ClientClassification);
    const newClientData = {
      name: values.name,
      unit: values.unit,
      responsavel: responsavel,
      classification: values.classification as ClientClassification,
    };
    onClientAdded(newClientData);
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para criar um novo perfil de cliente. O responsável será atribuído automaticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Innotech" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Unidade</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="LONDRINA" />
                        </FormControl>
                        <FormLabel className="font-normal">Londrina</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="CURITIBA" />
                        </FormControl>
                        <FormLabel className="font-normal">Curitiba</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="classification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classificação (Curva)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a curva do cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">Classe A</SelectItem>
                      <SelectItem value="B">Classe B</SelectItem>
                      <SelectItem value="C">Classe C</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit">Adicionar Cliente</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
