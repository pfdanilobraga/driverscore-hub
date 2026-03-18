import { SheetTrip } from '@/services/sheetsService';
import type { Driver, DriverStatus, Trip, Block } from '@/data/mockData';

/**
 * Parse a datetime string like "22/3/2026 15:31:00" into a Date object.
 */
function parseDateTime(value: string): Date | null {
  if (!value || value === '-' || value === '') return null;
  // Format: DD/MM/YYYY HH:MM:SS
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, day, month, year, hour, min, sec] = match;
  return new Date(+year, +month - 1, +day, +hour, +min, +sec);
}

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

function calculateTripScore(trip: SheetTrip): number {
  const eta = normalizeStatus(trip.status_eta);
  const cpt = normalizeStatus(trip.status_cpt);
  const dest = normalizeStatus(trip.status_eta_destino);

  const ocorr =
    normalizeOcorrencia(trip.ocorrencia_eta) +
    normalizeOcorrencia(trip.ocorrencia_cpt) +
    normalizeOcorrencia(trip.ocorrencia_eta_destino);

  const score = (eta * 30) + (cpt * 30) + (dest * 40) - (ocorr * 10);
  return Math.max(0, score);
}

export function transformTrips(sheetTrips: SheetTrip[]): Trip[] {
  // Filter out cancelled trips (driver_id === "0")
  const validTrips = sheetTrips.filter(st => st.driver_id && st.driver_id !== '0');

  console.log(`[DataAdapter] ${sheetTrips.length} total rows, ${validTrips.length} valid (filtered ${sheetTrips.length - validTrips.length} cancelled with driver_id=0)`);

  return validTrips.map((st, idx) => {
    const eta_origem = normalizeStatus(st.status_eta) * 100;
    const eta_destino = normalizeStatus(st.status_eta_destino) * 100;
    const cpt = normalizeStatus(st.status_cpt) * 100;
    const uso_app = Math.round((85 + Math.random() * 15) * 10) / 10;
    const checklist = st.checkin_origin_operator !== '' && st.checkin_origin_operator !== '-';
    const ocorrencia = normalizeOcorrencia(st.ocorrencia_eta) + normalizeOcorrencia(st.ocorrencia_cpt) + normalizeOcorrencia(st.ocorrencia_eta_destino) > 0;

    const score_final = calculateTripScore(st);

    return {
      id: st.trip_number || `t${idx + 1}`,
      driver_id: st.driver_id,
      driverName: st.driver_name && st.driver_name !== '-' ? st.driver_name : st.used_agency_name || 'Não atribuído',
      data: st.sta_origin_date || '',
      eta_origem,
      eta_destino,
      cpt,
      uso_app,
      checklist,
      ocorrencia,
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
