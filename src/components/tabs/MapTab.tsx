import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Navigation, AlertTriangle, Battery, Fuel, MapPin, Locate, Car, Clock, Zap, Camera, Construction, UserX, Volume2, Settings, Share2, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface TrafficAlert {
  id: string;
  type: 'traffic' | 'accident' | 'camera' | 'construction' | 'police';
  location: { lat: number; lng: number };
  description: string;
  severity: 'low' | 'medium' | 'high';
  reportedBy: string;
  timestamp: Date;
  votes: number;
}

interface Route {
  id: number;
  name: string;
  distance: string;
  time: string;
  fuel: string;
  alerts: number;
  type: 'recommended' | 'alternative' | 'economic';
  trafficLevel: 'light' | 'moderate' | 'heavy';
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
}

// Mapbox Component
const MapboxComponent: React.FC<{
  userLocation: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  trafficAlerts: TrafficAlert[];
  isNavigating: boolean;
  onLocationUpdate: (lat: number, lng: number) => void;
  mapboxToken: string;
}> = ({ userLocation, destination, trafficAlerts, isNavigating, onLocationUpdate, mapboxToken }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const alertMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    // Add geolocate control
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    // Add traffic layer and permanent incidents
    map.on('load', () => {
      map.addLayer({
        id: 'traffic',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        },
        'source-layer': 'traffic',
        paint: {
          'line-width': 3,
          'line-color': [
            'case',
            ['==', ['get', 'congestion'], 'low'], '#22c55e',
            ['==', ['get', 'congestion'], 'moderate'], '#eab308',
            ['==', ['get', 'congestion'], 'heavy'], '#ef4444',
            ['==', ['get', 'congestion'], 'severe'], '#991b1b',
            '#6b7280'
          ]
        }
      });
    });

    // Remover click do mapa - rota só muda com busca de endereço

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [mapboxToken]);

  // Update user marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'hsl(283 69% 35%)';
      el.style.border = '4px solid white';
      el.style.boxShadow = '0 0 20px rgba(106, 27, 154, 0.8)';
      el.style.position = 'relative';
      
      // Adicionar pulso animado
      const pulse = document.createElement('div');
      pulse.style.position = 'absolute';
      pulse.style.top = '-8px';
      pulse.style.left = '-8px';
      pulse.style.right = '-8px';
      pulse.style.bottom = '-8px';
      pulse.style.borderRadius = '50%';
      pulse.style.backgroundColor = 'rgba(106, 27, 154, 0.3)';
      pulse.style.animation = 'pulse 2s infinite';
      el.appendChild(pulse);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current);

      userMarkerRef.current = marker;
    }

    if (!isNavigating) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        essential: true
      });
    }
  }, [userLocation, isNavigating]);

  // Handle destination marker and routing
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old destination marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (destination) {
      // Add destination marker com estilo Waze
      const el = document.createElement('div');
      el.className = 'destination-marker';
      el.innerHTML = '📍';
      el.style.fontSize = '40px';
      el.style.cursor = 'pointer';
      el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([destination.lng, destination.lat])
        .addTo(mapRef.current);

      destinationMarkerRef.current = marker;

      // Fetch and display route
      if (isNavigating) {
        fetchRoute([userLocation.lng, userLocation.lat], [destination.lng, destination.lat]);
      }

      // Fit bounds to show both markers
      const bounds = new mapboxgl.LngLatBounds()
        .extend([userLocation.lng, userLocation.lat])
        .extend([destination.lng, destination.lat]);

      mapRef.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 50, right: 50 }
      });
    }
  }, [destination, isNavigating, userLocation]);

  // Fetch route from Mapbox Directions API com dados completos
  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    if (!mapRef.current) return null;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&steps=true&access_token=${mapboxToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];

        // Remove old route layer if it exists
        if (mapRef.current.getSource('route')) {
          mapRef.current.removeLayer('route');
          mapRef.current.removeSource('route');
        }

        // Add route layer
        mapRef.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        });

        mapRef.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': 'hsl(283 69% 35%)',
            'line-width': 8,
            'line-opacity': 0.9
          }
        });

        return route; // Retornar dados da rota
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
    return null;
  };

  // Handle traffic alerts markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    alertMarkersRef.current.forEach(marker => marker.remove());
    alertMarkersRef.current = [];

    // Add new markers
    trafficAlerts.forEach(alert => {
      const alertIcons = {
        traffic: '🚗',
        accident: '⚠️',
        camera: '📷',
        construction: '🚧',
        police: '👮'
      };

      const alertColors = {
        high: '#ef4444',
        medium: '#f97316',
        low: '#eab308'
      };

      const el = document.createElement('div');
      el.className = 'alert-marker';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = alertColors[alert.severity];
      el.style.border = '2px solid white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '18px';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.textContent = alertIcons[alert.type];

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([alert.location.lng, alert.location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <h3 style="margin: 0; font-weight: bold;">${alert.description}</h3>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">
                  Reportado por ${alert.reportedBy}<br/>
                  ${alert.votes} votos
                </p>
              </div>
            `)
        )
        .addTo(mapRef.current);

      alertMarkersRef.current.push(marker);
    });
  }, [trafficAlerts]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
};

// API Key Input Component
const MapboxTokenInput: React.FC<{ onTokenSet: (token: string) => void }> = ({ onTokenSet }) => {
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const mapboxKey = import.meta.env.VITE_MAPBOX_TOKEN;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mapboxKey);
    setCopied(true);
    toast({
      title: "Chave copiada!",
      description: "Cole no campo abaixo",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-secondary/30 via-background to-secondary/20">
      <div className="space-y-4 max-w-md w-full">
        {/* Info Box with Mapbox Key */}
        <Card className="bg-primary/10 border-2 border-primary/30">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              Copie a chave abaixo e cole onde solicita o token público do Mapbox
            </p>
            <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3 border border-primary/20">
              <code className="flex-1 text-xs text-foreground break-all font-mono">
                {mapboxKey}
              </code>
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="ghost"
                className="flex-shrink-0 h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Token Input Box */}
        <div className="bg-card rounded-xl p-6 shadow-xl border-2 border-primary/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <MapPin className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-primary">Configurar Mapbox</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Para usar o mapa funcional, você precisa de um token público do Mapbox
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Token Público do Mapbox
              </label>
              <Input
                type="text"
                placeholder="pk.eyJ1..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Button 
              onClick={() => onTokenSet(token)}
              disabled={!token.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Ativar Mapa
            </Button>
            
            <div className="text-xs text-muted-foreground text-center">
              <p>Obtenha seu token em:</p>
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Mapbox Access Tokens
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Report Alert Dialog Component
const ReportAlertDialog: React.FC<{ onReport: (alert: Omit<TrafficAlert, 'id' | 'timestamp' | 'votes'>) => void }> = ({ onReport }) => {
  const [alertType, setAlertType] = useState<TrafficAlert['type']>('traffic');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<TrafficAlert['severity']>('medium');
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        onReport({
          type: alertType,
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          description,
          severity,
          reportedBy: 'Usuário'
        });
        setOpen(false);
        setDescription('');
      });
    }
  };

  const alertOptions = [
    { value: 'traffic', label: 'Trânsito Lento', icon: Car },
    { value: 'accident', label: 'Acidente', icon: AlertTriangle },
    { value: 'camera', label: 'Radar', icon: Camera },
    { value: 'construction', label: 'Obra', icon: Construction },
    { value: 'police', label: 'Polícia', icon: UserX }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-active" variant="destructive" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Reportar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar Alerta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo de Alerta</label>
            <Select value={alertType} onValueChange={(value) => setAlertType(value as TrafficAlert['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {alertOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Severidade</label>
            <Select value={severity} onValueChange={(value) => setSeverity(value as TrafficAlert['severity'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Descrição (Opcional)</label>
            <Input
              placeholder="Adicione detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <Button onClick={handleSubmit} className="w-full">
            Enviar Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Navigation Bar Component
const NavigationBar: React.FC<{ 
  isNavigating: boolean; 
  currentSpeed: number; 
  speedLimit: number;
  eta: string;
  distance: string;
  nextInstruction: string;
}> = ({ isNavigating, currentSpeed, speedLimit, eta, distance, nextInstruction }) => {
  if (!isNavigating) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 shadow-lg z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="text-3xl font-bold">{currentSpeed}</div>
            <div className="text-xs">km/h</div>
          </div>
          <div className={`w-px h-10 ${currentSpeed > speedLimit ? 'bg-red-300' : 'bg-white/40'}`} />
          <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
            <div className="text-xl font-semibold">{speedLimit}</div>
            <div className="text-xs">Limite</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold">{eta}</div>
          <div className="text-sm">{distance}</div>
        </div>
        
        <Button variant="secondary" size="sm">
          <Volume2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-3 flex items-center space-x-3">
        <Navigation className="h-5 w-5" />
        <span className="text-sm">{nextInstruction}</span>
      </div>
    </div>
  );
};

export const MapTab: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: -23.5505, lng: -46.6333 });
  const [displayAddress, setDisplayAddress] = useState('São Paulo, SP');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [hasActiveRoute, setHasActiveRoute] = useState(false);
  const [trafficAlerts, setTrafficAlerts] = useState<TrafficAlert[]>([
    {
      id: '1',
      type: 'camera',
      location: { lat: -23.5515, lng: -46.6340 },
      description: 'Radar de velocidade',
      severity: 'high',
      reportedBy: 'Comunidade',
      timestamp: new Date(),
      votes: 23
    },
    {
      id: '2',
      type: 'traffic',
      location: { lat: -23.5525, lng: -46.6320 },
      description: 'Trânsito lento',
      severity: 'medium',
      reportedBy: 'Waze',
      timestamp: new Date(),
      votes: 12
    }
  ]);
  const [currentSpeed, setCurrentSpeed] = useState(65);
  const [speedLimit, setSpeedLimit] = useState(60);
  const [eta, setEta] = useState('15 min');
  const [remainingDistance, setRemainingDistance] = useState('8.2 km');
  const [nextInstruction, setNextInstruction] = useState('Continue reto por 2.1 km');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
    }
  }, []);

  // Save token to localStorage when set
  const handleTokenSet = (token: string) => {
    setMapboxToken(token);
    localStorage.setItem('mapbox_token', token);
  };

  const routes: Route[] = [
    {
      id: 1,
      name: 'Rota Recomendada',
      distance: '342 km',
      time: '4h 25min',
      fuel: '45L',
      alerts: 0,
      type: 'recommended',
      trafficLevel: 'light'
    },
    {
      id: 2,
      name: 'Rota Alternativa',
      distance: '368 km', 
      time: '4h 52min',
      fuel: '48L',
      alerts: 2,
      type: 'alternative',
      trafficLevel: 'moderate'
    },
    {
      id: 3,
      name: 'Rota Econômica',
      distance: '359 km',
      time: '5h 10min', 
      fuel: '42L',
      alerts: 1,
      type: 'economic',
      trafficLevel: 'heavy'
    }
  ];

  const handleStartNavigation = () => {
    setIsNavigating(true);
    // Simulate speed tracking
    const speedInterval = setInterval(() => {
      setCurrentSpeed(Math.floor(Math.random() * 40) + 40); // 40-80 km/h
    }, 3000);

    // Simulate ETA updates
    const etaInterval = setInterval(() => {
      const minutes = Math.floor(Math.random() * 5) + 13; // 13-18 minutes
      setEta(`${minutes} min`);
    }, 10000);

    return () => {
      clearInterval(speedInterval);
      clearInterval(etaInterval);
    };
  };

  const handleReportAlert = (alert: Omit<TrafficAlert, 'id' | 'timestamp' | 'votes'>) => {
    const newAlert: TrafficAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      votes: 0
    };
    setTrafficAlerts(prev => [...prev, newAlert]);
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setDisplayAddress(`Lat: ${newLocation.lat.toFixed(4)}, Lng: ${newLocation.lng.toFixed(4)}`);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoadingLocation(false);
        }
      );
    }
  };

  const handleLocationClick = (lat: number, lng: number) => {
    const newLocation = { lat, lng };
    setDestinationCoords(newLocation);
    setDestination(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // Geocoding with Mapbox - busca com resultados
  const searchLocation = async (query: string) => {
    if (!query.trim() || !mapboxToken) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5&proximity=${userLocation.lng},${userLocation.lat}&language=pt`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Selecionar resultado da busca e calcular rota
  const selectSearchResult = async (result: SearchResult) => {
    const [lng, lat] = result.center;
    setDestinationCoords({ lat, lng });
    setDestination(result.place_name);
    setShowSearchResults(false);
    setSearchResults([]);
    setHasActiveRoute(true);

    // Calcular rota e obter dados reais
    if (mapboxToken) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${lng},${lat}?geometries=geojson&steps=true&access_token=${mapboxToken}`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteData(route);
          
          // Atualizar ETA e distância com dados reais
          const durationMinutes = Math.round(route.duration / 60);
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          const etaText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
          setEta(etaText);
          
          const distanceKm = (route.distance / 1000).toFixed(1);
          setRemainingDistance(`${distanceKm} km`);
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatDistance = (meters: number) => {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  };

  // Debounce para pesquisa automática - só busca se não houver rota ativa
  useEffect(() => {
    const timer = setTimeout(() => {
      if (destination && !hasActiveRoute) {
        searchLocation(destination);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [destination, mapboxToken, hasActiveRoute]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Navigation Bar */}
      <NavigationBar 
        isNavigating={isNavigating}
        currentSpeed={currentSpeed}
        speedLimit={speedLimit}
        eta={eta}
        distance={remainingDistance}
        nextInstruction={nextInstruction}
      />

      {/* Header */}
      <div className={`bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 space-y-3 shadow-lg ${isNavigating ? 'mt-20' : ''}`}>
        {/* Status Bar */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            <span className="truncate max-w-[200px] font-medium">{displayAddress}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-white/20 rounded-lg px-2 py-1 backdrop-blur-sm">
              <Battery className="h-4 w-4" />
              <span className="font-semibold">85%</span>
            </div>
            <div className="flex items-center space-x-1 bg-white/20 rounded-lg px-2 py-1 backdrop-blur-sm">
              <Fuel className="h-4 w-4" />
              <span className="font-semibold">3/4</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {!isNavigating && (
          <div className="space-y-2 relative">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <Input
                  placeholder="Para onde você vai?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  className="pl-10 pr-10 bg-background text-foreground border-2 border-primary/20 rounded-xl shadow-lg h-12 text-base font-medium placeholder:text-muted-foreground"
                />
                {destination && (
                  <button
                    onClick={() => {
                      setDestination('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                      setDestinationCoords(null);
                      setRouteData(null);
                      setHasActiveRoute(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10"
                  >
                    <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <Button 
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-2 border-primary-foreground/50 rounded-xl h-12 px-4 backdrop-blur-sm"
                size="sm"
              >
                <Locate className={`h-5 w-5 ${isLoadingLocation ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                onClick={() => {
                  if (destinationCoords && routeData) {
                    setIsNavigating(true);
                    handleStartNavigation();
                  }
                }}
                disabled={!destinationCoords || !routeData}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl h-12 px-4 font-bold shadow-lg"
                size="sm"
              >
                <Navigation className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <Card className="absolute top-14 left-0 right-16 z-50 shadow-2xl border-2 border-primary/20 rounded-xl overflow-hidden">
                <ScrollArea className="max-h-64">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => selectSearchResult(result)}
                      className="p-3 hover:bg-secondary/50 cursor-pointer border-b border-border last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{result.text}</p>
                          <p className="text-sm text-muted-foreground truncate">{result.place_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </Card>
            )}
            
            {isSearching && (
              <div className="absolute top-14 left-0 right-16 z-50 bg-card shadow-xl rounded-xl p-4 flex items-center justify-center border-2 border-primary/20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-3 text-foreground">Buscando...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-muted">
        {!mapboxToken ? (
          <MapboxTokenInput onTokenSet={handleTokenSet} />
        ) : (
          <MapboxComponent 
            userLocation={userLocation}
            destination={destinationCoords || undefined}
            trafficAlerts={trafficAlerts}
            isNavigating={isNavigating}
            onLocationUpdate={handleLocationClick}
            mapboxToken={mapboxToken}
          />
        )}

        {/* Report Button - Top Left */}
        {mapboxToken && (
          <div className="absolute top-4 left-4 z-20">
            <ReportAlertDialog onReport={handleReportAlert} />
          </div>
        )}
        
        {/* Share Button - Top Right */}
        {mapboxToken && isNavigating && (
          <div className="absolute top-4 right-4 z-20">
            <Button 
              onClick={() => setIsNavigating(false)}
              variant="secondary"
              size="sm"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Speed Alert */}
        {isNavigating && currentSpeed > speedLimit && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg animate-pulse">
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-2" />
              <div className="text-lg font-bold">VELOCIDADE EXCESSIVA</div>
              <div className="text-sm">{currentSpeed} km/h (Limite: {speedLimit})</div>
            </div>
          </div>
        )}

        {/* Routes Panel */}
        {destination && !isNavigating && mapboxToken && (
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4 max-h-64 overflow-y-auto">
            <h3 className="font-semibold mb-3">Rotas Disponíveis</h3>
            <div className="space-y-2">
              {routes.map((route) => (
                <Card key={route.id} className="cursor-pointer hover:shadow-mobile transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{route.name}</h4>
                          {route.type === 'recommended' && (
                            <Badge variant="default">Recomendada</Badge>
                          )}
                          {route.alerts > 0 && (
                            <Badge variant="destructive">{route.alerts} alerta(s)</Badge>
                          )}
                          <Badge 
                            variant={
                              route.trafficLevel === 'light' ? 'default' :
                              route.trafficLevel === 'moderate' ? 'secondary' : 'destructive'
                            }
                          >
                            {route.trafficLevel === 'light' ? 'Trânsito Livre' :
                             route.trafficLevel === 'moderate' ? 'Trânsito Moderado' : 'Trânsito Intenso'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>{route.distance}</span>
                          <span>{route.time}</span>
                          <span>~{route.fuel} combustível</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedRoute(route);
                        setIsNavigating(true);
                      }}>
                        Iniciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        {isNavigating && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            <Button variant="secondary" size="sm">
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsNavigating(false)}>
              Parar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
