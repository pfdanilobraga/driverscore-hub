import { useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { mockTrips } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface EvaluationFormProps {
  tripId: string;
  onClose: () => void;
}

export function EvaluationForm({ tripId, onClose }: EvaluationFormProps) {
  const trip = mockTrips.find(t => t.id === tripId);
  const { toast } = useToast();

  const [comunicacao, setComunicacao] = useState('BOA');
  const [atendeu, setAtendeu] = useState(true);
  const [desvio, setDesvio] = useState('NENHUM');
  const [postura, setPostura] = useState('OK');
  const [ajuste, setAjuste] = useState([0]);
  const [observacao, setObservacao] = useState('');

  if (!trip) return null;

  const handleSubmit = () => {
    toast({
      title: 'Avaliação salva',
      description: `Viagem ${tripId} avaliada com sucesso. Ajuste: ${ajuste[0] >= 0 ? '+' : ''}${ajuste[0]}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Avaliar Viagem {tripId}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {trip.driverName} — {trip.data}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Comunicação</Label>
              <Select value={comunicacao} onValueChange={setComunicacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOA">Boa (+5)</SelectItem>
                  <SelectItem value="REGULAR">Regular (0)</SelectItem>
                  <SelectItem value="RUIM">Ruim (-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Desvio de Rota</Label>
              <Select value={desvio} onValueChange={setDesvio}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NENHUM">Nenhum (0)</SelectItem>
                  <SelectItem value="LEVE">Leve (-10)</SelectItem>
                  <SelectItem value="GRAVE">Grave (-20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Postura</Label>
              <Select value={postura} onValueChange={setPostura}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK (0)</SelectItem>
                  <SelectItem value="RUIM">Ruim (-10)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={atendeu} onCheckedChange={setAtendeu} />
              <Label className="text-xs">
                Atendeu {!atendeu && <span className="text-destructive">(-10)</span>}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">
              Ajuste Manual: <span className="font-mono font-bold">{ajuste[0] >= 0 ? '+' : ''}{ajuste[0]}</span>
            </Label>
            <Slider value={ajuste} onValueChange={setAjuste} min={-20} max={20} step={1} />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-20</span><span>0</span><span>+20</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Observação</Label>
            <Textarea
              placeholder="Detalhes adicionais sobre a viagem..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSubmit} className="flex-1">Salvar Avaliação</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
