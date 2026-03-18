import { ShieldAlert, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getBlockTypeLabel } from '@/data/mockData';
import { useData } from '@/contexts/DataContext';

export function BlocksList() {
  const { blocks, isLoading } = useData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Bloqueios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          Bloqueios
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {blocks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum bloqueio ativo
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motorista</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Motivo</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Início</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Fim</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Criado por</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{block.driverName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {getBlockTypeLabel(block.tipo)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{block.motivo}</td>
                    <td className="px-4 py-3 font-mono text-xs">{block.data_inicio}</td>
                    <td className="px-4 py-3 font-mono text-xs">{block.data_fim || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {block.ativo ? (
                        <Badge variant="destructive" className="text-[10px]">
                          <ShieldAlert className="h-3 w-3 mr-1" /> ATIVO
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          <ShieldOff className="h-3 w-3 mr-1" /> ENCERRADO
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{block.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
