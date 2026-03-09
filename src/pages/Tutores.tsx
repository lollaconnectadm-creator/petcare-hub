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

export default function Tutores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: tutores = [], isLoading } = useQuery({
    queryKey: ['tutores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutores')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const createTutor = useMutation({
    mutationFn: async (newTutor: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('tutores')
        .insert([{ ...newTutor, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutores'] });
      toast({ title: "Tutor cadastrado com sucesso!" });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao cadastrar tutor", description: error.message });
    }
  });

  const updateTutor = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('tutores').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutores'] });
      toast({ title: "Tutor atualizado com sucesso!" });
      setIsOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    }
  });

  const deleteTutor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tutores').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutores'] });
      toast({ title: "Tutor excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    }
  });

  const resetForm = () => {
    setNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setObservacoes("");
    setEditingId(null);
  };

  const handleEdit = (tutor: any) => {
    setEditingId(tutor.id);
    setNome(tutor.nome);
    setTelefone(tutor.telefone || "");
    setEmail(tutor.email || "");
    setEndereco(tutor.endereco || "");
    setObservacoes(tutor.observacoes || "");
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateTutor.mutate({ id: editingId, nome, telefone, email, endereco, observacoes });
    } else {
      createTutor.mutate({ nome, telefone, email, endereco, observacoes });
    }
  };

  const filteredTutores = tutores.filter(tutor => 
    tutor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tutores</h1>
          <p className="text-muted-foreground mt-1">Gerencie os clientes e donos dos pets.</p>
        </div>
        
        <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <SheetTrigger asChild>
            <Button className="gap-2" onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="h-4 w-4" />
              Novo Tutor
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Cadastrar Novo Tutor</SheetTitle>
              <SheetDescription>
                Preencha os dados abaixo para registrar um novo cliente no sistema.
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input id="endereco" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, Número, Bairro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea 
                  id="observacoes" 
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Informações adicionais..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createTutor.isPending}>
                  {createTutor.isPending ? "Salvando..." : "Salvar Tutor"}
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
            placeholder="Buscar por nome..." 
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
              <TableHead>Telefone</TableHead>
              <TableHead className="hidden md:table-cell">E-mail</TableHead>
              <TableHead className="hidden lg:table-cell">Endereço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando tutores...
                </TableCell>
              </TableRow>
            ) : filteredTutores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum tutor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredTutores.map((tutor) => (
                <TableRow key={tutor.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{tutor.nome}</TableCell>
                  <TableCell>{tutor.telefone || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{tutor.email || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground truncate max-w-[200px]">{tutor.endereco || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este tutor?')) {
                            deleteTutor.mutate(tutor.id);
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
