import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Loader2, TrendingUp, TrendingDown, DollarSign, Wallet,
  Trash2, Pencil, Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type Categoria = { id: string; nome: string; tipo: "receita" | "despesa" };

const formSchema = z.object({
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z.string().min(1, "Informe uma descrição"),
  valor: z.string().min(1, "Informe o valor").refine(
    (v) => !isNaN(parseFloat(v.replace(",", "."))) && parseFloat(v.replace(",", ".")) > 0,
    "Valor deve ser maior que zero"
  ),
  data: z.string().min(1, "Informe a data"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Financeiro() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: "receita",
      categoria: "",
      descricao: "",
      valor: "",
      data: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const tipoWatch = form.watch("tipo");

  // Fetch categories
  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categorias_financeiro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiro" as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data as unknown) as Categoria[];
    },
  });

  const categoriasReceita = categorias.filter((c) => c.tipo === "receita").map((c) => c.nome);
  const categoriasDespesa = categorias.filter((c) => c.tipo === "despesa").map((c) => c.nome);

  // Fetch financeiro for month
  const { data: registros = [], isLoading } = useQuery({
    queryKey: ["financeiro", monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financeiro")
        .select("*")
        .gte("data", monthStart)
        .lte("data", monthEnd)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Summary calculations
  const summary = useMemo(() => {
    const receitas = registros
      .filter((r: any) => r.tipo === "receita")
      .reduce((sum: number, r: any) => sum + Number(r.valor), 0);
    const despesas = registros
      .filter((r: any) => r.tipo === "despesa")
      .reduce((sum: number, r: any) => sum + Number(r.valor), 0);
    return { receitas, despesas, lucro: receitas - despesas };
  }, [registros]);

  // Chart data - daily aggregation
  const chartData = useMemo(() => {
    const map: Record<string, { date: string; receitas: number; despesas: number }> = {};
    registros.forEach((r: any) => {
      if (!map[r.data]) {
        map[r.data] = { date: r.data, receitas: 0, despesas: 0 };
      }
      if (r.tipo === "receita") map[r.data].receitas += Number(r.valor);
      else map[r.data].despesas += Number(r.valor);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [registros]);

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");
      const payload = {
        user_id: userData.user.id,
        tipo: values.tipo as any,
        categoria: values.categoria,
        descricao: values.descricao,
        valor: parseFloat(values.valor.replace(",", ".")),
        data: values.data,
      };
      if (editingId) {
        const { error } = await supabase.from("financeiro").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("financeiro").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success(editingId ? "Registro atualizado!" : "Registro criado!");
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financeiro").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] });
      toast.success("Registro removido!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const handleEdit = (registro: any) => {
    setEditingId(registro.id);
    form.reset({
      tipo: registro.tipo,
      categoria: registro.categoria,
      descricao: registro.descricao,
      valor: String(registro.valor),
      data: registro.data,
    });
    setIsDialogOpen(true);
  };

  const handleNewRecord = () => {
    setEditingId(null);
    form.reset({
      tipo: "receita",
      categoria: "",
      descricao: "",
      valor: "",
      data: format(new Date(), "yyyy-MM-dd"),
    });
    setIsDialogOpen(true);
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/configuracoes")}>
            <Settings className="mr-2 h-4 w-4" /> Categorias
          </Button>
          <Button onClick={handleNewRecord}>
            <Plus className="mr-2 h-4 w-4" /> Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
          ←
        </Button>
        <span className="text-lg font-semibold min-w-[180px] text-center">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
        </span>
        <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
          →
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4" style={{ color: "hsl(var(--success))" }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "hsl(var(--success))" }}>
              {formatCurrency(summary.receitas)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(summary.despesas)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.lucro >= 0 ? "" : "text-destructive"}`}
                 style={summary.lucro >= 0 ? { color: "hsl(var(--success))" } : undefined}>
              {formatCurrency(summary.lucro)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registros.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => format(parseISO(v), "dd/MM")}
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis fontSize={12} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(v) => format(parseISO(v as string), "dd/MM/yyyy")}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--chart-receita))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--chart-despesa))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : registros.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Wallet className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Nenhuma movimentação neste mês</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{format(parseISO(r.data), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            r.tipo === "receita"
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                          }
                        >
                          {r.tipo === "receita" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.categoria}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.descricao}</TableCell>
                      <TableCell
                        className="text-right font-medium"
                        style={r.tipo === "receita" ? { color: "hsl(var(--success))" } : undefined}
                      >
                        {r.tipo === "despesa" && "- "}
                        {formatCurrency(Number(r.valor))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(r.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Movimentação" : "Nova Movimentação"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); form.setValue("categoria", ""); }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {(tipoWatch === "receita" ? categoriasReceita : categoriasDespesa).map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Input placeholder="Ex: Banho do Rex" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
