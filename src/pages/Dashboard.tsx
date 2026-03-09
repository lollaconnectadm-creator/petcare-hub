import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dog, Droplets, Home, DollarSign, CalendarDays, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

  const { data: totalTutores = 0 } = useQuery({
    queryKey: ["dashboard-tutores"],
    queryFn: async () => {
      const { count, error } = await supabase.from("tutores").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalPets = 0 } = useQuery({
    queryKey: ["dashboard-pets"],
    queryFn: async () => {
      const { count, error } = await supabase.from("pets").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: agendamentosHoje = [] } = useQuery({
    queryKey: ["dashboard-agendamentos-hoje"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*, pet:pets(nome), tutor:tutores(nome)")
        .eq("data", today)
        .order("horario");
      if (error) throw error;
      return data;
    },
  });

  const { data: hospedagensAtivas = [] } = useQuery({
    queryKey: ["dashboard-hospedagens-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospedagens")
        .select("*, pet:pets(nome), tutor:tutores(nome)")
        .in("status", ["reservado", "hospedado", "pronto_retirada"])
        .order("data_entrada");
      if (error) throw error;
      return data;
    },
  });

  const { data: configData } = useQuery({
    queryKey: ["dashboard-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: financeiroMes = { receitas: 0, despesas: 0 } } = useQuery({
    queryKey: ["dashboard-financeiro-mes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financeiro")
        .select("tipo, valor")
        .gte("data", monthStart);
      if (error) throw error;
      const receitas = (data || []).filter(f => f.tipo === "receita").reduce((s, f) => s + Number(f.valor), 0);
      const despesas = (data || []).filter(f => f.tipo === "despesa").reduce((s, f) => s + Number(f.valor), 0);
      return { receitas, despesas };
    },
  });

  const pendentes = agendamentosHoje.filter((a: any) => a.status === "solicitado" || a.status === "confirmado").length;
  const maxHotel = configData?.max_hotel || 20;
  const ocupacao = hospedagensAtivas.filter((h: any) => h.status === "hospedado").length;
  const lucro = financeiroMes.receitas - financeiroMes.despesas;

  const stats = [
    { title: "Tutores", value: totalTutores, icon: Users, description: "cadastrados", color: "text-primary" },
    { title: "Pets", value: totalPets, icon: Dog, description: "cadastrados", color: "text-primary" },
    { title: "Agendamentos Hoje", value: agendamentosHoje.length, icon: Droplets, description: `${pendentes} pendente(s)`, color: "text-primary" },
    { title: "Hotel - Ocupação", value: `${ocupacao}/${maxHotel}`, icon: Home, description: `${Math.round((ocupacao / maxHotel) * 100)}% lotação`, color: ocupacao >= maxHotel ? "text-destructive" : "text-primary" },
  ];

  const getServicoLabel = (s: string) => {
    if (s === "banho") return "Banho";
    if (s === "tosa") return "Tosa";
    if (s === "banho_tosa") return "Banho & Tosa";
    return s;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      solicitado: "bg-secondary text-secondary-foreground",
      confirmado: "bg-primary/20 text-primary",
      concluido: "bg-primary text-primary-foreground",
      cancelado: "bg-destructive/20 text-destructive",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receitas (mês)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {financeiroMes.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas (mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {financeiroMes.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro (mês)</CardTitle>
            <DollarSign className={`h-4 w-4 ${lucro >= 0 ? "text-emerald-500" : "text-destructive"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucro >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agendamentos de hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Agendamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agendamentosHoje.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Nenhum agendamento para hoje.</p>
          ) : (
            <div className="space-y-3">
              {agendamentosHoje.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded">
                      {a.horario?.substring(0, 5)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{a.pet?.nome}</p>
                      <p className="text-xs text-muted-foreground">{a.tutor?.nome} · {getServicoLabel(a.servico)}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadge(a.status)}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hospedagens ativas */}
      {hospedagensAtivas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Pets no Hotel ({hospedagensAtivas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hospedagensAtivas.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{h.pet?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.tutor?.nome} · Saída prevista: {format(new Date(h.data_saida_prevista + "T12:00:00"), "dd/MM")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    h.status === "pronto_retirada" 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" 
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  }`}>
                    {h.status === "pronto_retirada" ? "Pronto p/ Retirada" : h.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}