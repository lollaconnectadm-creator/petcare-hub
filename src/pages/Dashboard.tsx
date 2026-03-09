import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Dog, Droplets, Home } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total de Clientes",
      value: "142",
      icon: Users,
      description: "+4 neste mês",
    },
    {
      title: "Pets Cadastrados",
      value: "284",
      icon: Dog,
      description: "+12 neste mês",
    },
    {
      title: "Banhos Hoje",
      value: "15",
      icon: Droplets,
      description: "5 aguardando",
    },
    {
      title: "Cães no Hotel",
      value: "8",
      icon: Home,
      description: "Lotação: 40%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao painel de controle do Pet Shop.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Avisos do Sistema</h2>
        <div className="text-sm text-muted-foreground">
          O sistema de agendamentos completos e módulo de hotelzinho serão habilitados nas próximas fases da implantação.
        </div>
      </div>
    </div>
  );
}
