import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  tutor_id: z.string().min(1, "Selecione um tutor"),
  pet_id: z.string().min(1, "Selecione um pet"),
  servico: z.enum(["banho", "tosa", "banho_tosa"], {
    required_error: "Selecione um serviço",
  }),
  data: z.date({
    required_error: "Selecione uma data",
  }),
  horario: z.string().min(1, "Selecione um horário"),
  observacoes: z.string().optional(),
});

type AgendamentoFormValues = z.infer<typeof formSchema>;

export default function Agendamentos() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<AgendamentoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tutor_id: "",
      pet_id: "",
      servico: "banho",
      horario: "09:00",
      observacoes: "",
    },
  });

  const selectedTutorId = form.watch("tutor_id");

  // Fetch tutores
  const { data: tutores = [] } = useQuery({
    queryKey: ["tutores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tutores").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch pets based on selected tutor
  const { data: pets = [] } = useQuery({
    queryKey: ["pets", selectedTutorId],
    queryFn: async () => {
      if (!selectedTutorId) return [];
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("tutor_id", selectedTutorId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTutorId,
  });

  // Fetch agendamentos for selected date
  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ["agendamentos", date?.toISOString()],
    queryFn: async () => {
      if (!date) return [];
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const formattedDate = format(startOfDay, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`
          *,
          pet:pets(nome),
          tutor:tutores(nome)
        `)
        .eq("data", formattedDate)
        .order("horario");
        
      if (error) throw error;
      return data;
    },
    enabled: !!date,
  });

  const createAgendamentoMutation = useMutation({
    mutationFn: async (values: AgendamentoFormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const formattedDate = format(values.data, 'yyyy-MM-dd');

      const { data, error } = await supabase.from("agendamentos").insert({
        user_id: userData.user.id,
        tutor_id: values.tutor_id,
        pet_id: values.pet_id,
        servico: values.servico,
        data: formattedDate,
        horario: values.horario,
        observacoes: values.observacoes,
        status: "solicitado",
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Agendamento criado com sucesso!");
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("agendamentos")
        .update({ status: status as any })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const onSubmit = (values: AgendamentoFormValues) => {
    createAgendamentoMutation.mutate(values);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "solicitado": return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
      case "confirmado": return "bg-primary/20 text-primary hover:bg-primary/30";
      case "concluido": return "bg-primary text-primary-foreground hover:bg-primary/90";
      case "cancelado": return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getServicoLabel = (servico: string) => {
    switch (servico) {
      case "banho": return "Banho";
      case "tosa": return "Tosa";
      case "banho_tosa": return "Banho & Tosa";
      default: return servico;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos do pet shop</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                <FormField
                  control={form.control}
                  name="tutor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tutor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tutor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tutores.map((tutor) => (
                            <SelectItem key={tutor.id} value={tutor.id}>
                              {tutor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pet_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedTutorId || pets.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedTutorId ? "Selecione um pet" : "Selecione um tutor primeiro"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pets.map((pet) => (
                            <SelectItem key={pet.id} value={pet.id}>
                              {pet.nome} {pet.raca ? `(${pet.raca})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="banho">Banho</SelectItem>
                          <SelectItem value="tosa">Tosa</SelectItem>
                          <SelectItem value="banho_tosa">Banho & Tosa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
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
                                  format(field.value, "P", { locale: ptBR })
                                ) : (
                                  <span>Escolha uma data</span>
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
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="horario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="time" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Cuidado com a orelha direita, usar shampoo específico..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAgendamentoMutation.isPending}>
                    {createAgendamentoMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Agendamento
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Calendário</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0 pb-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-0"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">
                Agenda de {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Hoje'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : agendamentos.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg mt-4">
                <CalendarIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Nenhum agendamento para esta data</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {agendamentos.map((agendamento: any) => (
                  <div 
                    key={agendamento.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-md flex flex-col items-center justify-center min-w-[70px]">
                        <Clock className="h-5 w-5 mb-1" />
                        <span className="font-bold">{agendamento.horario.substring(0, 5)}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{agendamento.pet?.nome}</h3>
                          <Badge variant="secondary" className={getStatusColor(agendamento.status)}>
                            {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tutor: {agendamento.tutor?.nome}
                        </p>
                        <p className="text-sm font-medium">
                          Serviço: {getServicoLabel(agendamento.servico)}
                        </p>
                        {agendamento.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            Obs: {agendamento.observacoes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-0 flex gap-2">
                      {agendamento.status === 'solicitado' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200"
                            onClick={() => updateStatusMutation.mutate({ id: agendamento.id, status: 'confirmado' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Confirmar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                            onClick={() => updateStatusMutation.mutate({ id: agendamento.id, status: 'cancelado' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      
                      {agendamento.status === 'confirmado' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                          onClick={() => updateStatusMutation.mutate({ id: agendamento.id, status: 'concluido' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
