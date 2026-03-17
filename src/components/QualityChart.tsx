import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTrips, mockDrivers } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function QualityChart() {
  const kpiData = [
    {
      name: 'ETA Orig. <95%',
      value: Math.round((mockTrips.filter(t => t.eta_origem < 95).length / mockTrips.length) * 100),
    },
    {
      name: 'ETA Dest. <90%',
      value: Math.round((mockTrips.filter(t => t.eta_destino < 90).length / mockTrips.length) * 100),
    },
    {
      name: 'CPT <98%',
      value: Math.round((mockTrips.filter(t => t.cpt < 98).length / mockTrips.length) * 100),
    },
    {
      name: 'App <90%',
      value: Math.round((mockTrips.filter(t => t.uso_app < 90).length / mockTrips.length) * 100),
    },
    {
      name: 'Sem Checklist',
      value: Math.round((mockTrips.filter(t => !t.checklist).length / mockTrips.length) * 100),
    },
    {
      name: 'Ocorrências',
      value: Math.round((mockTrips.filter(t => t.ocorrencia).length / mockTrips.length) * 100),
    },
  ];

  const getBarColor = (value: number) => {
    if (value > 30) return 'hsl(0, 72%, 51%)';
    if (value > 15) return 'hsl(38, 92%, 50%)';
    return 'hsl(152, 60%, 40%)';
  };

  const scoreDistribution = [
    { range: '0-40', count: mockDrivers.filter(d => d.scoreMedia <= 40).length },
    { range: '41-60', count: mockDrivers.filter(d => d.scoreMedia > 40 && d.scoreMedia <= 60).length },
    { range: '61-75', count: mockDrivers.filter(d => d.scoreMedia > 60 && d.scoreMedia <= 75).length },
    { range: '76-90', count: mockDrivers.filter(d => d.scoreMedia > 75 && d.scoreMedia <= 90).length },
    { range: '91-100', count: mockDrivers.filter(d => d.scoreMedia > 90).length },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">% Viagens com Penalidade por KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={kpiData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 89%)" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
              <YAxis type="category" dataKey="name" width={100} fontSize={11} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {kpiData.map((entry, idx) => (
                  <Cell key={idx} fill={getBarColor(entry.value)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribuição de Score dos Motoristas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 89%)" />
              <XAxis dataKey="range" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(220, 60%, 20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
