import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function Pets() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [nome, setNome] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [raca, setRaca] = useState("");
  const [idade, setIdade] = useState("");
  const [porte, setPorte] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [servico, setServico] = useState("");

  const { data: tutores = [] } = useQuery({
    queryKey: ['tutores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tutores').select('id, nome').order('nome');
      if (error) throw error;
      return data;
    }
  });

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pets')
        .select(`
          *,
          tutores (nome)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createPet = useMutation({
    mutationFn: async (newPet: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('pets')
        .insert([{ ...newPet, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({ title: "Pet cadastrado com sucesso!" });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar pet",
        description: error.message,
      });
    }
  });

  const deletePet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({ title: "Pet excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    }
  });

  const updatePet = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('pets').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({ title: "Pet atualizado com sucesso!" });
      setIsOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    }
  });

  const resetForm = () => {
    setNome("");
    setTutorId("");
    setRaca("");
    setIdade("");
    setPorte("");
    setObservacoes("");
    setServico("");
    setEditingId(null);
  };

  const handleEdit = (pet: any) => {
    setEditingId(pet.id);
    setNome(pet.nome);
    setTutorId(pet.tutor_id);
    setRaca(pet.raca || "");
    setIdade(pet.idade || "");
    setPorte(pet.porte || "");
    setObservacoes(pet.observacoes || "");
    setServico(pet.servico || "");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorId) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um tutor." });
      return;
    }
    const payload = { nome, tutor_id: tutorId, raca, idade, porte, observacoes, servico: servico || null };
    if (editingId) {
      updatePet.mutate({ id: editingId, ...payload });
    } else {
      createPet.mutate(payload);
    }
  };

  const filteredPets = pets.filter(pet => 
    pet.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (pet.tutores?.nome && pet.tutores.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pets</h1>
          <p className="text-muted-foreground mt-1">Gerencie os animais cadastrados no sistema.</p>
        </div>
        
        <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <SheetTrigger asChild>
            <Button className="gap-2" onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="h-4 w-4" />
              Novo Pet
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? "Editar Pet" : "Cadastrar Novo Pet"}</SheetTitle>
              <SheetDescription>
                {editingId ? "Altere os dados do animal." : "Preencha os dados do animal e vincule-o a um tutor existente."}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="tutor">Tutor (Proprietário) *</Label>
                <select 
                  id="tutor" 
                  required
                  value={tutorId}
                  onChange={e => setTutorId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione um tutor...</option>
                  {tutores.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Pet *</Label>
                <Input id="nome" required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Rex" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raca">Raça</Label>
                  <Input id="raca" value={raca} onChange={e => setRaca(e.target.value)} placeholder="Ex: Golden Retriever" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade</Label>
                  <Input id="idade" value={idade} onChange={e => setIdade(e.target.value)} placeholder="Ex: 3 anos" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="porte">Porte</Label>
                <select 
                  id="porte" 
                  value={porte}
                  onChange={e => setPorte(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="Pequeno">Pequeno (até 10kg)</option>
                  <option value="Médio">Médio (11 a 25kg)</option>
                  <option value="Grande">Grande (26 a 45kg)</option>
                  <option value="Gigante">Gigante (mais de 45kg)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="servico">Serviço Atribuído</Label>
                <select 
                  id="servico" 
                  value={servico}
                  onChange={e => setServico(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="banho">Banho</option>
                  <option value="tosa">Tosa</option>
                  <option value="banho_tosa">Banho e Tosa</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (Alergias, Comportamento)</Label>
                <textarea 
                  id="observacoes" 
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Detalhes importantes sobre o pet..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" disabled={createPet.isPending || updatePet.isPending}>
                  {(createPet.isPending || updatePet.isPending) ? "Salvando..." : editingId ? "Atualizar Pet" : "Salvar Pet"}
                </Button>
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou tutor..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nome</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead className="hidden md:table-cell">Raça</TableHead>
              <TableHead className="hidden sm:table-cell">Porte</TableHead>
              <TableHead className="hidden md:table-cell">Serviço</TableHead>
              <TableHead className="hidden lg:table-cell">Idade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando pets...
                </TableCell>
              </TableRow>
            ) : filteredPets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum pet encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredPets.map((pet) => (
                <TableRow key={pet.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{pet.nome}</TableCell>
                  <TableCell>{pet.tutores?.nome || 'Desconhecido'}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{pet.raca || '-'}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {pet.porte && (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {pet.porte}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {pet.servico && (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary">
                        {pet.servico === 'banho_tosa' ? 'Banho e Tosa' : pet.servico === 'banho' ? 'Banho' : 'Tosa'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{pet.idade || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(pet)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este pet?')) {
                            deletePet.mutate(pet.id);
                          }
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
