import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, MessageSquare, AlertTriangle, Camera, Send, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender: 'user' | 'company';
  message: string;
  time: Date;
  status: 'sent' | 'delivered' | 'read';
}

interface Incident {
  type: 'accident' | 'breakdown' | 'delay';
  description: string;
  location?: string;
  photos?: string[];
}

export const ContactTab: React.FC = () => {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [incident, setIncident] = useState<Incident>({
    type: 'delay',
    description: '',
  });
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'company',
      message: 'Bom dia! Como está a viagem?',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'read'
    },
    {
      id: '2',
      sender: 'user',
      message: 'Tudo bem! Saindo agora do ponto de carregamento.',
      time: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'read'
    },
    {
      id: '3',
      sender: 'company',
      message: 'Perfeito! Carga conferida e lacrada. Boa viagem!',
      time: new Date(Date.now() - 30 * 60 * 1000),
      status: 'read'
    }
  ]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: String(Date.now()),
      sender: 'user',
      message: newMessage,
      time: new Date(),
      status: 'sent'
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
    
    // Simular resposta automática da empresa após 2 segundos
    setTimeout(() => {
      const response: Message = {
        id: String(Date.now() + 1),
        sender: 'company',
        message: 'Mensagem recebida! Estamos acompanhando sua viagem.',
        time: new Date(),
        status: 'read'
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
    
    toast({
      title: "Mensagem enviada",
      description: "Sua mensagem foi enviada com sucesso!",
    });
  };

  const handleEmergencyCall = () => {
    toast({
      title: "🚨 Chamada de Emergência",
      description: "Conectando com central de emergência...",
      variant: "destructive",
    });
  };

  const handleVideoCall = () => {
    toast({
      title: "📹 Vídeo Chamada",
      description: "Conectando com despachante...",
    });
  };

  const handleSubmitIncident = () => {
    if (!incident.description.trim()) return;
    
    toast({
      title: "✅ Relatório Enviado",
      description: "Seu relatório de incidente foi registrado com sucesso!",
    });
    
    setIncident({ type: 'delay', description: '' });
  };

  const quickMessages = [
    'Carga segura ✅',
    'Tudo ok na estrada 🛣️',
    'Parada para descanso 💤',
    'Chegando ao destino 🎯'
  ];

  return (
    <div className="h-full bg-background">
      <Tabs defaultValue="communication" className="h-full flex flex-col">
        <div className="bg-primary text-primary-foreground p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Central de Comunicação</h2>
            <Badge variant="secondary" className="bg-green-500 text-white">
              Online
            </Badge>
          </div>
          <TabsList className="grid w-full grid-cols-2 bg-primary-foreground/10">
            <TabsTrigger value="communication" className="text-primary-foreground data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">
              Comunicação
            </TabsTrigger>
            <TabsTrigger value="incident" className="text-primary-foreground data-[state=active]:bg-primary-foreground data-[state=active]:text-primary">
              Reportar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="communication" className="flex-1 p-4 space-y-4">
          {/* Emergency Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={handleEmergencyCall}
              className="h-16 bg-red-500 hover:bg-red-600 text-white shadow-active"
            >
              <Phone className="h-6 w-6 mr-2" />
              Emergência
            </Button>
            <Button 
              onClick={handleVideoCall}
              className="h-16 shadow-active"
            >
              <Video className="h-6 w-6 mr-2" />
              Vídeo Call
            </Button>
          </div>

          {/* Chat Messages */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Chat com Despachante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 mb-4">
                <div className="space-y-3 pr-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.time.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Messages */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {quickMessages.map((msg, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setNewMessage(msg)}
                  >
                    {msg}
                  </Button>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incident" className="flex-1 p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Relatório de Incidente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Incident Type */}
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Incidente</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'accident', label: 'Acidente' },
                    { id: 'breakdown', label: 'Avaria' },
                    { id: 'delay', label: 'Atraso' }
                  ].map((type) => (
                    <Button
                      key={type.id}
                      variant={incident.type === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIncident({ ...incident, type: type.id as any })}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  placeholder="Descreva o que aconteceu..."
                  value={incident.description}
                  onChange={(e) => setIncident({ ...incident, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Location (auto-filled) */}
              <div className="flex items-center space-x-2 p-3 bg-secondary/30 rounded-lg">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Localização Atual</p>
                  <p className="text-xs text-muted-foreground">Rod. Pres. Dutra, KM 225 - SP</p>
                </div>
              </div>

              {/* Photo Upload */}
              <Button variant="outline" className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Adicionar Fotos
              </Button>

              {/* Submit */}
              <Button 
                onClick={handleSubmitIncident}
                className="w-full shadow-active"
                disabled={!incident.description}
              >
                Enviar Relatório
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};