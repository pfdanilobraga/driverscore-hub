import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';

export function ExportButton() {
  const { trips } = useData();

  const handleExport = () => {
    if (trips.length === 0) return;

    const headers = [
      'ID Viagem', 'Driver ID', 'Motorista', 'Data',
      'ETA Origem', 'ETA Destino', 'CPT', 'Ocorrências', 'Score',
    ];

    const rows = trips.map(t => [
      t.id,
      t.driver_id,
      t.driverName,
      t.data,
      t.status_eta,
      t.status_eta_destino,
      t.status_cpt,
      t.ocorrencia_count,
      t.score_final,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viagens_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs gap-1.5"
      onClick={handleExport}
      disabled={trips.length === 0}
    >
      <Download className="h-3.5 w-3.5" />
      Exportar Planilha
    </Button>
  );
}
