import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, Check, X, Settings, Tag, Hotel, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type Categoria = {
  id: string;
  nome: string;
  tipo: "receita" | "despesa";
};

type Config = {
  id: string;
  max_hotel: number;
  banhos_por_hora: number;
};

function CategoriaItem({
  cat,
  onDelete,
  onUpdate,
}: {
  cat: Categoria;
  onDelete: (id: string) => void;
  onUpdate: (id: string, nome: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(cat.nome);

  const save = () => {
    if (!nome.trim()) return;
    onUpdate(cat.id, nome.trim());
    setEditing(false);
  };

  const cancel = () => {
    setNome(cat.nome);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      {editing ? (
        <>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-7 flex-1 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            autoFocus
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={save}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={cancel}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium">{cat.nome}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(cat.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

function AddCategoriaRow({ tipo, onAdd }: { tipo: "receita" | "despesa"; onAdd: (nome: string, tipo: "receita" | "despesa") => void }) {
  const [nome, setNome] = useState("");

  const submit = () => {
    if (!nome.trim()) return;
    onAdd(nome.trim(), tipo);
    setNome("");
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Nova categoria..."
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        className="h-9 text-sm"
      />
      <Button size="sm" onClick={submit} disabled={!nome.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Configuracoes() {
  const queryClient = useQueryClient();

  // --- Categorias ---
  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categorias_financeiro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiro" as any)
        .select("*")
        .order("tipo")
        .order("nome");
      if (error) throw error;
      return (data as unknown) as Categoria[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async ({ nome, tipo }: { nome: string; tipo: "receita" | "despesa" }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("categorias_financeiro" as any).insert({
        user_id: userData.user.id,
        nome,
        tipo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias_financeiro"] });
      toast.success("Categoria adicionada!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from("categorias_financeiro" as any).update({ nome }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias_financeiro"] });
      toast.success("Categoria atualizada!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categorias_financeiro" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias_financeiro"] });
      toast.success("Categoria removida!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const receitas = categorias.filter((c) => c.tipo === "receita");
  const despesas = categorias.filter((c) => c.tipo === "despesa");

  // --- Configurações do sistema ---
  const { data: config } = useQuery<Config | null>({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as Config | null;
    },
  });

  const [maxHotel, setMaxHotel] = useState<string>("");
  const [banhosPorHora, setBanhosPorHora] = useState<string>("");

  // Sync local state once config loads
  useState(() => {
    if (config) {
      setMaxHotel(String(config.max_hotel));
      setBanhosPorHora(String(config.banhos_por_hora));
    }
  });

  const configMutation = useMutation({
    mutationFn: async ({ max_hotel, banhos_por_hora }: { max_hotel: number; banhos_por_hora: number }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");

      if (config?.id) {
        const { error } = await supabase
          .from("configuracoes")
          .update({ max_hotel, banhos_por_hora })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("configuracoes")
          .insert({ user_id: userData.user.id, max_hotel, banhos_por_hora });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
      toast.success("Configurações salvas!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const saveConfig = () => {
    const mh = parseInt(maxHotel || String(config?.max_hotel ?? 20));
    const bph = parseInt(banhosPorHora || String(config?.banhos_por_hora ?? 3));
    if (isNaN(mh) || mh <= 0 || isNaN(bph) || bph <= 0) {
      toast.error("Valores inválidos");
      return;
    }
    configMutation.mutate({ max_hotel: mh, banhos_por_hora: bph });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie categorias financeiras e parâmetros do sistema</p>
      </div>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Categorias Financeiras
          </CardTitle>
          <CardDescription>
            Personalize as categorias usadas no módulo financeiro para receitas e despesas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Receitas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Receitas</Badge>
              <span className="text-xs text-muted-foreground">{receitas.length} categorias</span>
            </div>
            <div className="space-y-2">
              {receitas.length === 0 && (
                <p className="text-sm text-muted-foreground italic px-1">Nenhuma categoria de receita cadastrada</p>
              )}
              {receitas.map((cat) => (
                <CategoriaItem
                  key={cat.id}
                  cat={cat}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onUpdate={(id, nome) => updateMutation.mutate({ id, nome })}
                />
              ))}
            </div>
            <AddCategoriaRow tipo="receita" onAdd={(nome, tipo) => addMutation.mutate({ nome, tipo })} />
          </div>

          <Separator />

          {/* Despesas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/10">Despesas</Badge>
              <span className="text-xs text-muted-foreground">{despesas.length} categorias</span>
            </div>
            <div className="space-y-2">
              {despesas.length === 0 && (
                <p className="text-sm text-muted-foreground italic px-1">Nenhuma categoria de despesa cadastrada</p>
              )}
              {despesas.map((cat) => (
                <CategoriaItem
                  key={cat.id}
                  cat={cat}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onUpdate={(id, nome) => updateMutation.mutate({ id, nome })}
                />
              ))}
            </div>
            <AddCategoriaRow tipo="despesa" onAdd={(nome, tipo) => addMutation.mutate({ nome, tipo })} />
          </div>
        </CardContent>
      </Card>

      {/* Hotel Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5 text-primary" />
            Hotelzinho
          </CardTitle>
          <CardDescription>Configure a capacidade e operação do hotel para pets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vagas máximas do hotel</label>
              <Input
                type="number"
                min="1"
                placeholder={String(config?.max_hotel ?? 20)}
                value={maxHotel || String(config?.max_hotel ?? "")}
                onChange={(e) => setMaxHotel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Número total de vagas disponíveis para hospedagem</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Banhos por hora
              </label>
              <Input
                type="number"
                min="1"
                placeholder={String(config?.banhos_por_hora ?? 3)}
                value={banhosPorHora || String(config?.banhos_por_hora ?? "")}
                onChange={(e) => setBanhosPorHora(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Capacidade de atendimento por hora para banhos</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={saveConfig} disabled={configMutation.isPending}>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
