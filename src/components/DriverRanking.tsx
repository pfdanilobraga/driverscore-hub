import { Trophy, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockDrivers, getScoreColor, getStatusVariant } from '@/data/mockData';

export function DriverRanking() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-accent" />
          Ranking de Motoristas
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Viagens</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Variância</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Ocorr.</th>
              </tr>
            </thead>
            <tbody>
              {mockDrivers.map((driver, idx) => (
                <tr key={driver.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold text-xs ${idx < 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{driver.nome}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(driver.status)} className="text-[10px]">
                      {driver.status}
                    </Badge>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${getScoreColor(driver.scoreMedia)}`}>
                    {driver.scoreMedia}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{driver.totalViagens}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{driver.variancia}</td>
                  <td className="px-4 py-3 text-right">
                    {driver.ocorrencias > 0 ? (
                      <span className="inline-flex items-center gap-1 text-destructive font-mono font-medium">
                        <AlertCircle className="h-3 w-3" /> {driver.ocorrencias}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-mono">0</span>
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
