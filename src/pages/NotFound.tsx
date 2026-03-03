import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
      <div className="text-center space-y-6 px-6">
        <div className="space-y-4">
          <AlertTriangle className="h-24 w-24 text-primary mx-auto" />
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Página não encontrada</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        
        <Button className="shadow-active" asChild>
          <a href="/">
            <Home className="h-4 w-4 mr-2" />
            Voltar ao LogOpti
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
