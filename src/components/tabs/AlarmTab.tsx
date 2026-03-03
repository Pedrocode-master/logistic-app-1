import React, { useState, useEffect } from 'react';
import { Clock, Coffee, Bed, Fuel, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Alarm {
  id: string;
  type: 'break' | 'rest' | 'fuel' | 'custom';
  label: string;
  time?: string;
  interval?: number;
  enabled: boolean;
  nextTrigger?: Date;
}

export const AlarmTab: React.FC = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([
    {
      id: '1',
      type: 'break',
      label: 'Pausa para Refeição',
      interval: 4 * 60, // 4 hours in minutes
      enabled: true,
      nextTrigger: new Date(Date.now() + 2 * 60 * 1000) // 2 minutos para teste
    },
    {
      id: '2',
      type: 'rest',
      label: 'Descanso Obrigatório',
      interval: 8 * 60, // 8 hours in minutes
      enabled: true,
      nextTrigger: new Date(Date.now() + 5 * 60 * 1000) // 5 minutos para teste
    },
    {
      id: '3',
      type: 'fuel',
      label: 'Lembrete de Abastecimento',
      interval: 0,
      enabled: false,
    },
    {
      id: '4',
      type: 'custom',
      label: 'Alarme Personalizado',
      time: '14:30',
      enabled: false,
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      checkAlarms();
    }, 1000);

    return () => clearInterval(timer);
  }, [alarms]);

  const checkAlarms = () => {
    const now = new Date();
    alarms.forEach(alarm => {
      if (!alarm.enabled || !alarm.nextTrigger) return;
      
      if (alarm.nextTrigger.getTime() <= now.getTime()) {
        triggerAlarm(alarm);
      }
    });
  };

  const triggerAlarm = (alarm: Alarm) => {
    // Mostrar notificação visual
    toast({
      title: `⏰ ${alarm.label}`,
      description: "Hora de fazer uma pausa!",
      duration: 10000,
    });

    // Tocar som de alarme (se disponível)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSmK0fPTgjMGHm7A7+OZSA0OVqvn77FgGgxGn+DyvmwhBSmK0fPTgjMGHm7A7+OZSAsOVqvn77FgGgxGn+DyvmwhBSmK0fPTgjMGHm7A7+OZSAsOVqvn77FgGg==');
      audio.play().catch(() => {});
    } catch (e) {}

    // Atualizar próximo trigger se for um alarme recorrente
    if (alarm.interval) {
      setAlarms(alarms.map(a => 
        a.id === alarm.id 
          ? { ...a, nextTrigger: new Date(Date.now() + alarm.interval * 60 * 1000) }
          : a
      ));
    } else {
      // Desabilitar alarme único após disparar
      setAlarms(alarms.map(a => 
        a.id === alarm.id 
          ? { ...a, enabled: false }
          : a
      ));
    }
  };

  const toggleAlarm = (id: string) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id 
        ? { ...alarm, enabled: !alarm.enabled }
        : alarm
    ));
  };

  const getAlarmIcon = (type: string) => {
    switch (type) {
      case 'break':
        return <Coffee className="h-4 w-4" />;
      case 'rest':
        return <Bed className="h-4 w-4" />;
      case 'fuel':
        return <Fuel className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Vencido';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getNextAlarms = () => {
    return alarms
      .filter(alarm => alarm.enabled && alarm.nextTrigger)
      .sort((a, b) => (a.nextTrigger?.getTime() || 0) - (b.nextTrigger?.getTime() || 0))
      .slice(0, 3);
  };

  return (
    <div className="h-full bg-background p-4 space-y-6">
      {/* Current Time Display */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-primary">
              {currentTime.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <div className="text-lg text-muted-foreground">
              {currentTime.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Alarms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Próximos Lembretes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getNextAlarms().length > 0 ? (
              getNextAlarms().map((alarm) => (
                <div key={alarm.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAlarmIcon(alarm.type)}
                    <div>
                      <p className="font-medium">{alarm.label}</p>
                      <p className="text-sm text-muted-foreground">
                        em {formatTimeRemaining(alarm.nextTrigger!)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {alarm.nextTrigger?.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhum lembrete ativo
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alarm Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Configurações de Alarmes</CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alarms.map((alarm) => (
              <div key={alarm.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAlarmIcon(alarm.type)}
                  <div>
                    <p className="font-medium">{alarm.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {alarm.interval 
                        ? `A cada ${Math.floor(alarm.interval / 60)}h`
                        : alarm.time || 'Personalizado'
                      }
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={alarm.enabled}
                  onCheckedChange={() => toggleAlarm(alarm.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};