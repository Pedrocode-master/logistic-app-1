import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Palette, 
  Globe, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Truck,
  CreditCard,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SettingsTabProps {
  onLogout?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onLogout }) => {
  const [notifications, setNotifications] = useState({
    routes: true,
    alarms: true,
    emergencies: true,
    messages: true
  });
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('pt-BR');

  const userProfile = {
    name: 'João Silva',
    email: 'joao.silva@empresa.com',
    phone: '(11) 99999-9999',
    license: 'CNH 123456789',
    vehicle: 'Volvo FH 540 - ABC-1234'
  };

  const toggleNotification = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const SettingsItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    onClick?: () => void;
  }> = ({ icon, title, subtitle, action, onClick }) => (
    <div 
      className={`flex items-center justify-between p-4 ${onClick ? 'cursor-pointer hover:bg-secondary/30' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action || (onClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />)}
    </div>
  );

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h2 className="text-lg font-semibold">Configurações</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Perfil do Motorista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{userProfile.name}</h3>
                <p className="text-muted-foreground">{userProfile.email}</p>
              </div>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Foto
              </Button>
            </div>

            <Separator />

            {/* Profile Details */}
            <div className="space-y-3">
              <SettingsItem
                icon={<User className="h-4 w-4" />}
                title="Nome Completo"
                subtitle={userProfile.name}
                onClick={() => console.log('Edit name')}
              />
              <SettingsItem
                icon={<CreditCard className="h-4 w-4" />}
                title="CNH"
                subtitle={userProfile.license}
                onClick={() => console.log('Edit license')}
              />
              <SettingsItem
                icon={<Truck className="h-4 w-4" />}
                title="Veículo"
                subtitle={userProfile.vehicle}
                onClick={() => console.log('Edit vehicle')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsItem
              icon={<Bell className="h-4 w-4" />}
              title="Alertas de Rota"
              subtitle="Avisos sobre tráfego e condições da estrada"
              action={
                <Switch 
                  checked={notifications.routes}
                  onCheckedChange={() => toggleNotification('routes')}
                />
              }
            />
            <SettingsItem
              icon={<Bell className="h-4 w-4" />}
              title="Lembretes de Alarme"
              subtitle="Notificações de pausas e descansos"
              action={
                <Switch 
                  checked={notifications.alarms}
                  onCheckedChange={() => toggleNotification('alarms')}
                />
              }
            />
            <SettingsItem
              icon={<Bell className="h-4 w-4" />}
              title="Emergências"
              subtitle="Alertas críticos de segurança"
              action={
                <Switch 
                  checked={notifications.emergencies}
                  onCheckedChange={() => toggleNotification('emergencies')}
                />
              }
            />
            <SettingsItem
              icon={<Bell className="h-4 w-4" />}
              title="Mensagens"
              subtitle="Chat com despachante e empresa"
              action={
                <Switch 
                  checked={notifications.messages}
                  onCheckedChange={() => toggleNotification('messages')}
                />
              }
            />
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preferências do App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsItem
              icon={<Palette className="h-4 w-4" />}
              title="Tema do Aplicativo"
              subtitle={isDarkMode ? "Escuro" : "Claro"}
              action={
                <Switch 
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                />
              }
            />
            <SettingsItem
              icon={<Globe className="h-4 w-4" />}
              title="Idioma"
              subtitle={language === 'pt-BR' ? 'Português (Brasil)' : 'English'}
              onClick={() => setLanguage(language === 'pt-BR' ? 'en-US' : 'pt-BR')}
            />
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ajuda e Suporte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsItem
              icon={<Shield className="h-4 w-4" />}
              title="Política de Privacidade"
              onClick={() => console.log('Privacy policy')}
            />
            <SettingsItem
              icon={<HelpCircle className="h-4 w-4" />}
              title="FAQ e Ajuda"
              subtitle="Perguntas frequentes sobre segurança"
              onClick={() => console.log('Help')}
            />
            <SettingsItem
              icon={<HelpCircle className="h-4 w-4" />}
              title="Feedback"
              subtitle="Envie sugestões e melhorias"
              onClick={() => console.log('Feedback')}
            />
          </CardContent>
        </Card>

        {/* App Info & Logout */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>LogOpti v1.0.0</p>
              <p className="mt-1">Segurança e humanização na logística</p>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair do App
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};