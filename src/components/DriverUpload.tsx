import { useState, useRef } from 'react';
import { Upload, FileUp, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { parseDriverCSV, upsertDrivers } from '@/services/driverService';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/DataContext';

export function DriverUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refreshData } = useData();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const drivers = parseDriverCSV(text);

      if (drivers.length === 0) {
        toast({
          title: 'Erro na planilha',
          description: 'Nenhum motorista encontrado. Verifique se a planilha contém as colunas driver_id e driver_name.',
          variant: 'destructive',
        });
        setResult({ success: false, count: 0 });
        return;
      }

      const count = await upsertDrivers(drivers);
      setResult({ success: true, count });
      toast({
        title: 'Planilha carregada com sucesso',
        description: `${count} motoristas importados/atualizados.`,
      });
      refreshData();
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: 'Erro ao importar',
        description: 'Falha ao processar a planilha. Tente novamente.',
        variant: 'destructive',
      });
      setResult({ success: false, count: 0 });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>Base de Motoristas</span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFile}
          />

          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="h-3.5 w-3.5" />
            {uploading ? 'Importando...' : 'Importar CSV'}
          </Button>

          {result && (
            <span className={`text-xs flex items-center gap-1 ${result.success ? 'text-success' : 'text-destructive'}`}>
              {result.success ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {result.success ? `${result.count} motoristas carregados` : 'Falha na importação'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
