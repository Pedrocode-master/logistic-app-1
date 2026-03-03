import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin, Plus, Trash2, CheckCircle, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Delivery {
  id: string;
  address: string;
  estimatedTime: number; // in minutes
  status: 'pending' | 'in-progress' | 'completed';
  startTime?: Date;
}

export const DeliveryTab: React.FC = () => {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: '1',
      address: 'Rua das Flores, 123 - Centro',
      estimatedTime: 15,
      status: 'in-progress',
      startTime: new Date(),
    },
    {
      id: '2',
      address: 'Av. Paulista, 1000 - Bela Vista',
      estimatedTime: 25,
      status: 'pending',
    },
    {
      id: '3',
      address: 'Rua Augusta, 456 - Consolação',
      estimatedTime: 20,
      status: 'pending',
    },
  ]);
  const [newAddress, setNewAddress] = useState('');
  const [newEstimatedTime, setNewEstimatedTime] = useState('');

  const addDelivery = () => {
    if (!newAddress || !newEstimatedTime) {
      toast({
        title: "Campos incompletos",
        description: "Preencha o endereço e o tempo estimado",
        variant: "destructive",
      });
      return;
    }

    const newDelivery: Delivery = {
      id: Date.now().toString(),
      address: newAddress,
      estimatedTime: parseInt(newEstimatedTime),
      status: 'pending',
    };

    setDeliveries([...deliveries, newDelivery]);
    setNewAddress('');
    setNewEstimatedTime('');
    
    toast({
      title: "Entrega adicionada",
      description: "Nova entrega adicionada ao itinerário",
    });
  };

  const removeDelivery = (id: string) => {
    setDeliveries(deliveries.filter(d => d.id !== id));
    toast({
      title: "Entrega removida",
      description: "Entrega removida do itinerário",
    });
  };

  const completeDelivery = (id: string) => {
    setDeliveries(deliveries.map(d => 
      d.id === id ? { ...d, status: 'completed' as const } : d
    ));
    toast({
      title: "Entrega concluída",
      description: "Entrega marcada como concluída",
    });
  };

  const startDelivery = (id: string) => {
    setDeliveries(deliveries.map(d => 
      d.id === id ? { ...d, status: 'in-progress' as const, startTime: new Date() } : d
    ));
    toast({
      title: "Entrega iniciada",
      description: "Navegação iniciada para a entrega",
    });
  };

  const getTotalTime = () => {
    return deliveries
      .filter(d => d.status !== 'completed')
      .reduce((sum, d) => sum + d.estimatedTime, 0);
  };

  const getEstimatedFinishTime = () => {
    const totalMinutes = getTotalTime();
    const finishTime = new Date();
    finishTime.setMinutes(finishTime.getMinutes() + totalMinutes);
    return finishTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getDeliveryTime = (delivery: Delivery) => {
    if (delivery.status === 'completed') {
      return 'Concluída';
    }
    
    if (delivery.status === 'in-progress' && delivery.startTime) {
      const elapsed = Math.floor((Date.now() - delivery.startTime.getTime()) / 60000);
      const remaining = Math.max(0, delivery.estimatedTime - elapsed);
      return `${remaining} min restantes`;
    }
    
    return `${delivery.estimatedTime} min`;
  };

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  const inProgressDeliveries = deliveries.filter(d => d.status === 'in-progress');
  const completedDeliveries = deliveries.filter(d => d.status === 'completed');

  return (
    <div className="h-full bg-gradient-to-b from-background to-secondary/20 p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Tempo Total</span>
          </div>
          <p className="text-2xl font-bold text-primary">{getTotalTime()} min</p>
        </Card>

        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Conclusão</span>
          </div>
          <p className="text-2xl font-bold text-primary">{getEstimatedFinishTime()}</p>
        </Card>
      </div>

      {/* Add Delivery Form */}
      <Card className="p-4 mb-4 bg-card/95 backdrop-blur-sm">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Nova Entrega
        </h3>
        <div className="space-y-2">
          <Input
            placeholder="Endereço de entrega"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="border-primary/20"
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Tempo (min)"
              value={newEstimatedTime}
              onChange={(e) => setNewEstimatedTime(e.target.value)}
              className="border-primary/20"
            />
            <Button onClick={addDelivery} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </Card>

      {/* Delivery List */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-3">
          {/* In Progress */}
          {inProgressDeliveries.map((delivery) => (
            <Card key={delivery.id} className="p-4 bg-primary/20 border-primary">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{delivery.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{getDeliveryTime(delivery)}</span>
                  </div>
                  <Badge className="mt-2 bg-primary text-primary-foreground">Em andamento</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => completeDelivery(delivery.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeDelivery(delivery.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Pending */}
          {pendingDeliveries.map((delivery) => (
            <Card key={delivery.id} className="p-4 bg-card border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{delivery.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{getDeliveryTime(delivery)}</span>
                  </div>
                  <Badge variant="secondary" className="mt-2">Pendente</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => startDelivery(delivery.id)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Iniciar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeDelivery(delivery.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Completed */}
          {completedDeliveries.map((delivery) => (
            <Card key={delivery.id} className="p-4 bg-muted/50 border-border opacity-60">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold line-through">{delivery.address}</p>
                  </div>
                  <Badge variant="outline" className="mt-2">Concluída</Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDelivery(delivery.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
