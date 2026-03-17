import { TrendingUp, TrendingDown, AlertTriangle, Users, Route, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { mockDrivers, mockTrips, mockBlocks } from '@/data/mockData';

const stats = [
  {
    label: 'Motoristas Ativos',
    value: mockDrivers.filter(d => d.status === 'ATIVO').length,
    total: mockDrivers.length,
    icon: Users,
    trend: 'up' as const,
  },
  {
    label: 'Score Médio',
    value: Math.round(mockDrivers.reduce((a, d) => a + d.scoreMedia, 0) / mockDrivers.length),
    suffix: '/100',
    icon: BarChart3,
    trend: 'up' as const,
  },
  {
    label: 'Viagens Hoje',
    value: mockTrips.filter(t => t.data === '2025-03-17').length,
    icon: Route,
    trend: 'neutral' as const,
  },
  {
    label: 'Bloqueios Ativos',
    value: mockBlocks.filter(b => b.ativo).length,
    icon: AlertTriangle,
    trend: 'down' as const,
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
              {stat.total && (
                <span className="text-sm text-muted-foreground mb-1">/ {stat.total}</span>
              )}
              {stat.suffix && (
                <span className="text-sm text-muted-foreground mb-1">{stat.suffix}</span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-success" />}
              {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
              <span className="text-muted-foreground">vs. semana anterior</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
