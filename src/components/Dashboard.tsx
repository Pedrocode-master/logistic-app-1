import React, { useState } from 'react';
import { Map, Clock, Phone, Settings, Package } from "lucide-react";
import { MapTab } from './tabs/MapTab';
import { AlarmTab } from './tabs/AlarmTab';
import { ContactTab } from './tabs/ContactTab';
import { SettingsTab } from './tabs/SettingsTab';
import { DeliveryTab } from './tabs/DeliveryTab';

type TabType = 'map' | 'alarm' | 'delivery' | 'contact' | 'settings';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

const tabs: TabItem[] = [
  { id: 'map', label: 'Mapas', icon: Map, component: MapTab },
  { id: 'alarm', label: 'Relógio', icon: Clock, component: AlarmTab },
  { id: 'delivery', label: 'Entregas', icon: Package, component: DeliveryTab },
  { id: 'contact', label: 'Contato', icon: Phone, component: ContactTab },
  { id: 'settings', label: 'Config', icon: Settings, component: SettingsTab },
];

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('map');

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || MapTab;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ActiveComponent />
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border px-2 py-1">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-[60px] transition-all duration-200 ${
                  isActive 
                    ? 'text-primary bg-secondary/50' 
                    : 'text-muted-foreground hover:text-primary hover:bg-secondary/30'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};