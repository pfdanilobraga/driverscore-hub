import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getScoreColor } from '@/data/mockData';
import { useData } from '@/contexts/DataContext';

interface TripListProps {
  onEvaluate: (tripId: string) => void;
}

export function TripList({ onEvaluate }: TripListProps) {
  const { trips, isLoading } = useData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-accent" /> Viagens Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-accent" />
          Viagens Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">ETA Orig.</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">ETA Dest.</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">CPT</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">App %</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Check</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Ocorr.</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody>
              {trips.slice(0, 30).map((trip) => (
                <tr key={trip.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">{trip.id}</td>
                  <td className="px-4 py-3 font-medium">{trip.driverName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{trip.data}</td>
                  <td className={`px-4 py-3 text-right font-mono ${trip.eta_origem < 95 ? 'text-destructive' : ''}`}>
                    {trip.eta_origem}%
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${trip.eta_destino < 90 ? 'text-destructive' : ''}`}>
                    {trip.eta_destino}%
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${trip.cpt < 98 ? 'text-destructive' : ''}`}>
                    {trip.cpt}%
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${trip.uso_app < 90 ? 'text-destructive' : ''}`}>
                    {trip.uso_app}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    {trip.checklist ? (
                      <CheckCircle className="h-4 w-4 text-success mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {trip.ocorrencia ? (
                      <Badge variant="destructive" className="text-[10px]">SIM</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${getScoreColor(trip.score_final)}`}>
                    {trip.score_final}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!trip.evaluated ? (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onEvaluate(trip.id)}>
                        Avaliar
                      </Button>
                    ) : (
                      <span className="text-xs text-success font-medium">Avaliada</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
