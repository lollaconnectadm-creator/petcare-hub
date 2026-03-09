import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Users, Dog, Home, LogOut, Menu, CalendarDays } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";

export function Layout() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Agendamentos", path: "/agendamentos", icon: CalendarDays },
    { name: "Tutores", path: "/tutores", icon: Users },
    { name: "Pets", path: "/pets", icon: Dog },
  ];

  const Sidebar = () => (
    <div className="flex h-full w-full flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground">
      <div className="flex items-center gap-2 px-2 py-4">
        <Dog className="h-8 w-8 text-primary" />
        <span className="text-xl font-bold tracking-tight">PetSystem</span>
      </div>
      <div className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              location.pathname === item.path
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/50"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </div>
      <Button variant="ghost" className="mt-auto justify-start gap-3 w-full">
        <LogOut className="h-5 w-5" />
        Sair
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 border-r bg-sidebar md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b bg-card px-4 md:hidden">
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <span className="ml-4 text-lg font-semibold">PetSystem</span>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
