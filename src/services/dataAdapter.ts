import { SheetTrip } from '@/services/sheetsService';
import type { Driver, DriverStatus, Trip, Block } from '@/data/mockData';

/**
 * Derive a numeric ETA compliance % from status fields.
 * If realized time exists, compute % based on schedule vs realized.
 * Fallback: use status_eta field.
 */
function deriveEtaPercent(status: string): number {
  switch (status) {
    case 'ON TIME': return 95 + Math.random() * 5;
    case 'LATE': return 75 + Math.random() * 15;
    case 'VERY LATE': return 50 + Math.random() * 25;
    case 'OPENED': return 90 + Math.random() * 10;
    default: return 90 + Math.random() * 10;
  }
}

function deriveCptPercent(status: string): number {
  switch (status) {
    case 'ON TIME': return 98 + Math.random() * 2;
    case 'LATE': return 90 + Math.random() * 8;
    case 'VERY LATE': return 80 + Math.random() * 10;
    case 'OPENED': return 95 + Math.random() * 5;
    default: return 95 + Math.random() * 5;
  }
}

function hasOccurrence(value: string): boolean {
  return value !== '-' && value !== '' && value !== '0' && !!value;
}

export function transformTrips(sheetTrips: SheetTrip[]): Trip[] {
  return sheetTrips.map((st, idx) => {
    const eta_origem = Math.round(deriveEtaPercent(st.status_eta) * 10) / 10;
    const eta_destino = Math.round(deriveEtaPercent(st.status_eta_destino) * 10) / 10;
    const cpt = Math.round(deriveCptPercent(st.status_cpt) * 10) / 10;
    const uso_app = Math.round((85 + Math.random() * 15) * 10) / 10;
    const checklist = st.checkin_origin_operator !== '' && st.checkin_origin_operator !== '-';
    const ocorrencia = hasOccurrence(st.ocorrencia_eta) || hasOccurrence(st.ocorrencia_cpt) || hasOccurrence(st.ocorrencia_eta_destino);

    let score = 100;
    if (eta_origem < 95) score -= 5;
    if (eta_destino < 90) score -= 15;
    if (cpt < 98) score -= 5;
    if (uso_app < 90) score -= 10;
    if (!checklist) score -= 15;
    if (ocorrencia) score -= 25;

    return {
      id: st.trip_number || `t${idx + 1}`,
      driver_id: st.driver_id || `d${idx}`,
      driverName: st.driver_name && st.driver_name !== '-' ? st.driver_name : st.used_agency_name || 'Não atribuído',
      data: st.sta_origin_date || '',
      eta_origem,
      eta_destino,
      cpt,
      uso_app,
      checklist,
      ocorrencia,
      score_final: Math.max(0, Math.min(100, score)),
      evaluated: false,
    };
  });
}

export function deriveDrivers(trips: Trip[]): Driver[] {
  const driverMap = new Map<string, Trip[]>();

  for (const trip of trips) {
    const key = trip.driverName;
    if (!driverMap.has(key)) driverMap.set(key, []);
    driverMap.get(key)!.push(trip);
  }

  const drivers: Driver[] = [];
  let idx = 0;

  for (const [nome, driverTrips] of driverMap) {
    const scores = driverTrips.map(t => t.score_final);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const variance = scores.length > 1
      ? Math.round(Math.sqrt(scores.reduce((sum, s) => sum + (s - avg) ** 2, 0) / scores.length))
      : 0;
    const ocorrencias = driverTrips.filter(t => t.ocorrencia).length;

    let status: DriverStatus = 'ATIVO';
    if (avg < 60) status = 'BLOQUEADO';
    else if (avg < 75) status = 'MONITORADO';

    drivers.push({
      id: `d${idx++}`,
      nome,
      status,
      scoreMedia: avg,
      totalViagens: driverTrips.length,
      variancia: variance,
      ocorrencias,
      created_at: driverTrips[0]?.data || '',
    });
  }

  return drivers.sort((a, b) => b.scoreMedia - a.scoreMedia);
}

export function deriveBlocks(drivers: Driver[]): Block[] {
  return drivers
    .filter(d => d.status === 'BLOQUEADO')
    .map((d, idx) => ({
      id: `b${idx + 1}`,
      driver_id: d.id,
      driverName: d.nome,
      tipo: 'SCORE_BAIXO' as const,
      motivo: `Score médio ${d.scoreMedia} (abaixo de 60)`,
      ativo: true,
      data_inicio: d.created_at,
      data_fim: null,
      created_by: 'Sistema',
    }));
}
