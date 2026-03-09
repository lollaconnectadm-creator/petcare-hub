import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Pencil, Trash2, Hotel, AlertTriangle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusOptions = [
  { value: "reservado", label: "Reservado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "hospedado", label: "Hospedado", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "pronto_retirada", label: "Pronto p/ Retirada", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  { value: "finalizado", label: "Finalizado", color: "bg-muted text-muted-foreground" },
] as const;

const formSchema = z.object({
  pet_id: z.string().min(1, "Selecione o pet"),
  tutor_id: z.string().min(1, "Selecione o tutor"),
  data_entrada: z.string().min(1, "Informe a data de entrada"),
  data_saida_prevista: z.string().min(1, "Informe a data prevista de saída"),
  valor_diaria: z.coerce.number().min(0, "Valor inválido"),
  status: z.enum(["reservado", "hospedado", "pronto_retirada", "finalizado"]),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function calcTotal(entrada: string, saida: string, diaria: number) {
  if (!entrada || !saida) return 0;
  const days = Math.max(differenceInDays(parseISO(saida), parseISO(entrada)), 1);
  return days * diaria;
}

export default function Hospedagens() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ativos");
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pet_id: "", tutor_id: "", data_entrada: "", data_saida_prevista: "",
      valor_diaria: 0, status: "reservado", observacoes: "",
    },
  });

  const watchTutor = form.watch("tutor_id");
  const watchEntrada = form.watch("data_entrada");
  const watchSaida = form.watch("data_saida_prevista");
  const watchDiaria = form.watch("valor_diaria");
  const totalCalculado = calcTotal(watchEntrada, watchSaida, watchDiaria);

  // Queries
  const { data: hospedagens = [], isLoading } = useQuery({
    queryKey: ["hospedagens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospedagens")
        .select("*, pets(nome), tutores(nome)")
        .order("data_entrada", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tutores = [] } = useQuery({
    queryKey: ["tutores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tutores").select("id, nome").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: pets = [] } = useQuery({
    queryKey: ["pets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pets").select("id, nome, tutor_id").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: config } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const maxVagas = config?.max_hotel ?? 20;

  // Filtered pets by selected tutor
  const filteredPets = useMemo(() => {
    if (!watchTutor) return pets;
    return pets.filter((p: any) => p.tutor_id === watchTutor);
  }, [watchTutor, pets]);

  // Occupancy
  const ocupacaoAtual = useMemo(() => {
    return hospedagens.filter((h: any) => h.status === "hospedado" || h.status === "reservado").length;
  }, [hospedagens]);

  const ocupacaoPercent = Math.min((ocupacaoAtual / maxVagas) * 100, 100);
  const vagasLivres = Math.max(maxVagas - ocupacaoAtual, 0);

  // Filtered list
  const filteredHospedagens = useMemo(() => {
    if (statusFilter === "ativos") return hospedagens.filter((h: any) => h.status !== "finalizado");
    if (statusFilter === "todos") return hospedagens;
    return hospedagens.filter((h: any) => h.status === statusFilter);
  }, [hospedagens, statusFilter]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const total = calcTotal(values.data_entrada, values.data_saida_prevista, values.valor_diaria);
      const payload = { ...values, total, user_id: user.id, observacoes: values.observacoes || null };

      if (editingId) {
        const { error } = await supabase.from("hospedagens").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        if (ocupacaoAtual >= maxVagas && (values.status === "reservado" || values.status === "hospedado")) {
          throw new Error("Capacidade máxima atingida!");
        }
        const { error } = await supabase.from("hospedagens").insert([payload as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospedagens"] });
      toast.success(editingId ? "Hospedagem atualizada!" : "Hospedagem registrada!");
      closeDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hospedagens").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospedagens"] });
      toast.success("Hospedagem removida!");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  function openNew() {
    setEditingId(null);
    form.reset({ pet_id: "", tutor_id: "", data_entrada: format(new Date(), "yyyy-MM-dd"), data_saida_prevista: "", valor_diaria: 0, status: "reservado", observacoes: "" });
    setIsDialogOpen(true);
  }

  function openEdit(h: any) {
    setEditingId(h.id);
    form.reset({
      pet_id: h.pet_id, tutor_id: h.tutor_id,
      data_entrada: h.data_entrada, data_saida_prevista: h.data_saida_prevista,
      valor_diaria: Number(h.valor_diaria), status: h.status, observacoes: h.observacoes || "",
    });
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditingId(null);
    form.reset();
  }

  function getStatusBadge(status: string) {
    const s = statusOptions.find(o => o.value === status);
    return <Badge className={s?.color ?? ""}>{s?.label ?? status}</Badge>;
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hotelzinho</h1>
          <p className="text-muted-foreground">Gestão de hospedagem de pets</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Hospedagem</Button>
      </div>

      {/* Occupancy Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ocupação</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ocupacaoAtual} / {maxVagas}</div>
            <Progress value={ocupacaoPercent} className="mt-2" />
            {ocupacaoPercent >= 90 && (
              <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" /> Capacidade quase esgotada!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vagas Livres</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vagasLivres}</div>
            <p className="text-xs text-muted-foreground">disponíveis agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hospedados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hospedagens.filter((h: any) => h.status === "hospedado").length}
            </div>
            <p className="text-xs text-muted-foreground">pets no hotel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pronto p/ Retirada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hospedagens.filter((h: any) => h.status === "pronto_retirada").length}
            </div>
            <p className="text-xs text-muted-foreground">aguardando tutor</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Hospedagens</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="reservado">Reservados</SelectItem>
                <SelectItem value="hospedado">Hospedados</SelectItem>
                <SelectItem value="pronto_retirada">Pronto p/ Retirada</SelectItem>
                <SelectItem value="finalizado">Finalizados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredHospedagens.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhuma hospedagem encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pet</TableHead>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída Prev.</TableHead>
                    <TableHead>Diária</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHospedagens.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.pets?.nome ?? "—"}</TableCell>
                      <TableCell>{h.tutores?.nome ?? "—"}</TableCell>
                      <TableCell>{format(parseISO(h.data_entrada), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{format(parseISO(h.data_saida_prevista), "dd/MM/yyyy")}</TableCell>
                      <TableCell>R$ {Number(h.valor_diaria).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">R$ {Number(h.total).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(h.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(h)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(h.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Hospedagem" : "Nova Hospedagem"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
              <FormField control={form.control} name="tutor_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutor</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); form.setValue("pet_id", ""); }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tutor" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {tutores.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="pet_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o pet" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {filteredPets.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="data_entrada" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Entrada</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="data_saida_prevista" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saída Prevista</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="valor_diaria" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Diária (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex flex-col justify-end">
                  <p className="text-sm text-muted-foreground">Total estimado</p>
                  <p className="text-xl font-bold">R$ {totalCalculado.toFixed(2)}</p>
                </div>
              </div>

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea placeholder="Alimentação, comportamento, notas do funcionário..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
