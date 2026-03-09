import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

// Dados simulados para visualização
const mockPets = [
  { id: "1", nome: "Rex", tutor: "João Silva", raca: "Golden Retriever", porte: "Grande", idade: "3 anos" },
  { id: "2", nome: "Mimi", tutor: "Maria Oliveira", raca: "Poodle", porte: "Pequeno", idade: "5 anos" },
  { id: "3", nome: "Thor", tutor: "Carlos Santos", raca: "Bulldog Francês", porte: "Médio", idade: "1 ano" },
];

export default function Pets() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pets</h1>
          <p className="text-muted-foreground mt-1">Gerencie os animais cadastrados no sistema.</p>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Pet
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Cadastrar Novo Pet</SheetTitle>
              <SheetDescription>
                Preencha os dados do animal e vincule-o a um tutor existente.
              </SheetDescription>
            </SheetHeader>
            <form className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="tutor">Tutor (Proprietário)</Label>
                <select 
                  id="tutor" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione um tutor...</option>
                  <option value="1">João Silva</option>
                  <option value="2">Maria Oliveira</option>
                  <option value="3">Carlos Santos</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Pet</Label>
                <Input id="nome" placeholder="Ex: Rex" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raca">Raça</Label>
                  <Input id="raca" placeholder="Ex: Golden Retriever" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade</Label>
                  <Input id="idade" placeholder="Ex: 3 anos" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="porte">Porte</Label>
                <select 
                  id="porte" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Selecione...</option>
                  <option value="pequeno">Pequeno (até 10kg)</option>
                  <option value="medio">Médio (11 a 25kg)</option>
                  <option value="grande">Grande (26 a 45kg)</option>
                  <option value="gigante">Gigante (mais de 45kg)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (Alergias, Comportamento)</Label>
                <textarea 
                  id="observacoes" 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Detalhes importantes sobre o pet..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline">Cancelar</Button>
                <Button type="submit">Salvar Pet</Button>
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
              <TableHead className="hidden lg:table-cell">Idade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPets.map((pet) => (
              <TableRow key={pet.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{pet.nome}</TableCell>
                <TableCell>{pet.tutor}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{pet.raca}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {pet.porte}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{pet.idade}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
