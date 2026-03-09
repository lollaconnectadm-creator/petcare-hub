import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths,
  isSameDay, parseISO, isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, Plus, Loader2, Clock, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "week" | "month";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am-6pm

const servicoColors: Record<string, string> = {
  banho: "bg-[hsl(var(--chart-receita))]/15 border-l-[3px] border-l-[hsl(var(--chart-receita))]",
  tosa: "bg-primary/10 border-l-[3px] border-l-primary",
  banho_tosa: "bg-[hsl(var(--warning))]/15 border-l-[3px] border-l-[hsl(var(--warning))]",
};

const servicoBadgeColors: Record<string, string> = {
  banho: "text-xs px-1.5 py-0.5 rounded font-medium" + " bg-[hsl(var(--chart-receita))]/20",
  tosa: "text-xs px-1.5 py-0.5 rounded font-medium bg-primary/15 text-primary",
  banho_tosa: "text-xs px-1.5 py-0.5 rounded font-medium bg-[hsl(var(--warning))]/20",
};

const getServicoLabel = (s: string) => {
  switch (s) {
    case "banho": return "Banho";
    case "tosa": return "Tosa";
    case "banho_tosa": return "B&T";
    default: return s;
  }
};

const statusColors: Record<string, string> = {
  solicitado: "bg-secondary text-secondary-foreground",
  confirmado: "bg-primary/15 text-primary",
  concluido: "bg-[hsl(var(--chart-receita))]/15",
  cancelado: "bg-destructive/10 text-destructive",
};

export default function AgendaProfissional() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterFuncionario, setFilterFuncionario] = useState<string>("all");
  const [filterServico, setFilterServico] = useState<string>("all");

  const queryClient = useQueryClient();

  // Date range based on view
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case "day":
        return { start: currentDate, end: currentDate };
      case "week":
        return {
          start: startOfWeek(currentDate, { locale: ptBR }),
          end: endOfWeek(currentDate, { locale: ptBR }),
        };
      case "month":
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  }, [viewMode, currentDate]);

  const days = useMemo(
    () => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
    [dateRange]
  );

  const startStr = format(dateRange.start, "yyyy-MM-dd");
  const endStr = format(dateRange.end, "yyyy-MM-dd");

  // Fetch agendamentos
  const { data: agendamentos = [], isLoading } = useQuery({
    queryKey: ["agenda-pro", startStr, endStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agendamentos")
        .select(`*, pet:pets(nome), tutor:tutores(nome), funcionario:funcionarios(nome)`)
        .gte("data", startStr)
        .lte("data", endStr)
        .order("horario");
      if (error) throw error;
      return data;
    },
  });

  // Fetch funcionarios
  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("funcionarios").select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Filter
  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((a: any) => {
      if (filterFuncionario !== "all" && a.funcionario_id !== filterFuncionario) return false;
      if (filterServico !== "all" && a.servico !== filterServico) return false;
      return true;
    });
  }, [agendamentos, filterFuncionario, filterServico]);

  const navigate = (dir: number) => {
    switch (viewMode) {
      case "day": setCurrentDate((d) => (dir > 0 ? addDays(d, 1) : subDays(d, 1))); break;
      case "week": setCurrentDate((d) => (dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1))); break;
      case "month": setCurrentDate((d) => (dir > 0 ? addMonths(d, 1) : subMonths(d, 1))); break;
    }
  };

  const getDateLabel = () => {
    switch (viewMode) {
      case "day": return format(currentDate, "EEEE, dd 'de' MMMM yyyy", { locale: ptBR });
      case "week":
        return `${format(dateRange.start, "dd MMM", { locale: ptBR })} - ${format(dateRange.end, "dd MMM yyyy", { locale: ptBR })}`;
      case "month": return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
  };

  const getAgendamentosForDayHour = (day: Date, hour: number) => {
    return filteredAgendamentos.filter((a: any) => {
      const aDate = parseISO(a.data);
      const aHour = parseInt(a.horario.split(":")[0]);
      return isSameDay(aDate, day) && aHour === hour;
    });
  };

  const getAgendamentosForDay = (day: Date) => {
    return filteredAgendamentos.filter((a: any) => isSameDay(parseISO(a.data), day));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda Profissional</h1>
          <p className="text-muted-foreground">Visualização avançada dos agendamentos</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold ml-2 capitalize">{getDateLabel()}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border overflow-hidden">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    viewMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-accent"
                  )}
                >
                  {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>

            <Select value={filterFuncionario} onValueChange={setFilterFuncionario}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Funcionário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {funcionarios.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterServico} onValueChange={setFilterServico}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="banho">Banho</SelectItem>
                <SelectItem value="tosa">Tosa</SelectItem>
                <SelectItem value="banho_tosa">Banho & Tosa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === "month" ? (
        /* MONTH VIEW */
        <Card>
          <CardContent className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* Day headers */}
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {/* Pad start */}
              {Array.from({ length: days[0].getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="bg-background p-2 min-h-[80px]" />
              ))}
              {/* Days */}
              {days.map((day) => {
                const dayAgendamentos = getAgendamentosForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "bg-background p-1.5 min-h-[80px] cursor-pointer hover:bg-accent/30 transition-colors",
                      isToday(day) && "ring-2 ring-primary ring-inset"
                    )}
                    onClick={() => {
                      setCurrentDate(day);
                      setViewMode("day");
                    }}
                  >
                    <span className={cn(
                      "text-xs font-medium",
                      isToday(day) ? "text-primary font-bold" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayAgendamentos.slice(0, 3).map((a: any) => (
                        <div
                          key={a.id}
                          className={cn(
                            "text-[10px] leading-tight px-1 py-0.5 rounded truncate",
                            servicoColors[a.servico]
                          )}
                        >
                          {a.horario.substring(0, 5)} {a.pet?.nome}
                        </div>
                      ))}
                      {dayAgendamentos.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayAgendamentos.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* DAY / WEEK VIEW */
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header row with days */}
              <div className={cn(
                "grid border-b",
                viewMode === "day" ? "grid-cols-[60px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]"
              )}>
                <div className="p-2 border-r bg-muted" />
                {(viewMode === "day" ? [currentDate] : days).map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 text-center border-r last:border-r-0 bg-muted",
                      isToday(day) && "bg-primary/10"
                    )}
                  >
                    <div className="text-xs text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      isToday(day) ? "text-primary" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className={cn(
                    "grid border-b last:border-b-0 min-h-[60px]",
                    viewMode === "day" ? "grid-cols-[60px_1fr]" : "grid-cols-[60px_repeat(7,1fr)]"
                  )}
                >
                  <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r bg-muted/50 pt-1">
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {(viewMode === "day" ? [currentDate] : days).map((day) => {
                    const slots = getAgendamentosForDayHour(day, hour);
                    return (
                      <div
                        key={day.toISOString()}
                        className="border-r last:border-r-0 p-0.5 relative hover:bg-accent/20 transition-colors"
                      >
                        {slots.map((a: any) => (
                          <div
                            key={a.id}
                            className={cn(
                              "rounded px-1.5 py-1 mb-0.5 text-xs cursor-pointer transition-all hover:shadow-md",
                              servicoColors[a.servico],
                              statusColors[a.status]
                            )}
                          >
                            <div className="font-medium truncate">
                              {a.horario.substring(0, 5)} - {a.pet?.nome}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              {a.tutor?.nome}
                              {a.funcionario?.nome && ` • ${a.funcionario.nome}`}
                            </div>
                            <span className={cn(servicoBadgeColors[a.servico])}>
                              {getServicoLabel(a.servico)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium">Legenda:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-receita))", opacity: 0.3 }} />
          Banho
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary/30" />
          Tosa
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--warning))", opacity: 0.3 }} />
          Banho & Tosa
        </div>
      </div>
    </div>
  );
}
