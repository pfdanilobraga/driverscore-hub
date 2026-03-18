import { SheetTrip } from '@/services/sheetsService';
import type { Driver, DriverStatus, Trip, Block } from '@/data/mockData';

/** Score calculation based on PRD formula */

/**
 * Calculate ETA compliance % based on scheduled vs realized time.
 * 100% = on time or early. Decreases proportionally with delay.
 * If no realized time, use status string as fallback.
 */
function normalizeStatus(status: string): number {
  const s = (status || '').trim().toUpperCase();
  return (s === 'ON TIME' || s === 'EARLY') ? 1 : 0;
}

function normalizeOcorrencia(value: string): number {
  return (!value || value.trim() === '' || value.trim() === '-') ? 0 : 1;
}

function isOcorrenciaValida(value: string, ignoredList: string[]): number {
  if (!value || value.trim() === '' || value.trim() === '-') return 0;
  if (ignoredList.includes(value.trim())) return 0;
  return 1;
}

export function calculateTripScore(trip: SheetTrip | { status_eta: string; status_cpt: string; status_eta_destino: string; ocorrencia_eta: string; ocorrencia_cpt: string; ocorrencia_eta_destino: string }, ignoredOccurrences: string[] = []): number {
  const eta = normalizeStatus(trip.status_eta);
  const cpt = normalizeStatus(trip.status_cpt);
  const dest = normalizeStatus(trip.status_eta_destino);

  const ocorr =
    isOcorrenciaValida(trip.ocorrencia_eta, ignoredOccurrences) +
    isOcorrenciaValida(trip.ocorrencia_cpt, ignoredOccurrences) +
    isOcorrenciaValida(trip.ocorrencia_eta_destino, ignoredOccurrences);

  const score = (eta * 30) + (cpt * 30) + (dest * 40) - (ocorr * 10);
  return Math.max(0, score);
}

/** Extract unique occurrence texts from trips */
export function extractUniqueOccurrences(sheetTrips: SheetTrip[]): string[] {
  const set = new Set<string>();
  for (const t of sheetTrips) {
    for (const field of [t.ocorrencia_eta, t.ocorrencia_cpt, t.ocorrencia_eta_destino]) {
      const v = (field || '').trim();
      if (v && v !== '-') set.add(v);
    }
  }
  return Array.from(set).sort();
}

export function transformTrips(sheetTrips: SheetTrip[]): Trip[] {
  // Filter out cancelled trips (driver_id === "0")
  const validTrips = sheetTrips.filter(st => st.driver_id && st.driver_id !== '0');

  console.log(`[DataAdapter] ${sheetTrips.length} total rows, ${validTrips.length} valid (filtered ${sheetTrips.length - validTrips.length} cancelled with driver_id=0)`);

  return validTrips.map((st, idx) => {
    const ocorrencia_count = normalizeOcorrencia(st.ocorrencia_eta) + normalizeOcorrencia(st.ocorrencia_cpt) + normalizeOcorrencia(st.ocorrencia_eta_destino);
    const score_final = calculateTripScore(st);

    return {
      id: st.trip_number || `t${idx + 1}`,
      driver_id: st.driver_id,
      driverName: st.driver_name && st.driver_name !== '-' ? st.driver_name : st.used_agency_name || 'Não atribuído',
      data: st.eta_scheduled_origin_edited || st.sta_origin_date || '',
      status_eta: (st.status_eta || '').trim() || '—',
      status_eta_destino: (st.status_eta_destino || '').trim() || '—',
      status_cpt: (st.status_cpt || '').trim() || '—',
      ocorrencia: ocorrencia_count > 0,
      ocorrencia_count,
      score_final,
      evaluated: false,
    };
  });
}

export function deriveDrivers(trips: Trip[]): Driver[] {
  const driverMap = new Map<string, Trip[]>();

  for (const trip of trips) {
    const key = trip.driver_id; // Group by driver_id, not name
    if (!driverMap.has(key)) driverMap.set(key, []);
    driverMap.get(key)!.push(trip);
  }

  const drivers: Driver[] = [];
  let idx = 0;

  for (const [driverId, driverTrips] of driverMap) {
    const nome = driverTrips[0].driverName;
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
      id: driverId,
      nome: `${nome} (${driverId})`,
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
