import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

// Dados simulados para visualização
const mockTutores = [
  { id: "1", nome: "João Silva", telefone: "(11) 98765-4321", email: "joao@email.com", endereco: "Rua das Flores, 123" },
  { id: "2", nome: "Maria Oliveira", telefone: "(11) 91234-5678", email: "maria@email.com", endereco: "Av Paulista, 1000" },
  { id: "3", nome: "Carlos Santos", telefone: "(11) 99999-8888", email: "carlos@email.com", endereco: "Rua Augusta, 500" },
];

export default function Tutores() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tutores</h1>
          <p className="text-muted-foreground mt-1">Gerencie os clientes e donos dos pets.</p>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button className="gap-2">
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
            <form className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" placeholder="Ex: João da Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input id="telefone" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input id="endereco" placeholder="Rua, Número, Bairro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <textarea 
                  id="observacoes" 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Informações adicionais..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline">Cancelar</Button>
                <Button type="submit">Salvar Tutor</Button>
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
            {mockTutores.map((tutor) => (
              <TableRow key={tutor.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{tutor.nome}</TableCell>
                <TableCell>{tutor.telefone}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{tutor.email}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground truncate max-w-[200px]">{tutor.endereco}</TableCell>
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
