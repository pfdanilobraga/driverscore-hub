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
function calcEtaPercent(scheduled: string, realized: string, status: string): number {
  const schedDate = parseDateTime(scheduled);
  const realDate = parseDateTime(realized);

  if (schedDate && realDate) {
    const diffMinutes = (realDate.getTime() - schedDate.getTime()) / 60000;
    if (diffMinutes <= 0) return 100; // on time or early
    // Each 10 min late = -5%, floor at 0
    const penalty = Math.min(100, (diffMinutes / 10) * 5);
    return Math.round((100 - penalty) * 10) / 10;
  }

  // Fallback: derive from status
  switch (status) {
    case 'ON TIME': return 100;
    case 'LATE': return 85;
    case 'VERY LATE': return 60;
    case 'OPENED': return 100; // not yet due
    default: return 100;
  }
}

function calcCptPercent(scheduled: string, realized: string, status: string): number {
  const schedDate = parseDateTime(scheduled);
  const realDate = parseDateTime(realized);

  if (schedDate && realDate) {
    const diffMinutes = (realDate.getTime() - schedDate.getTime()) / 60000;
    if (diffMinutes <= 0) return 100;
    const penalty = Math.min(100, (diffMinutes / 10) * 3);
    return Math.round((100 - penalty) * 10) / 10;
  }

  switch (status) {
    case 'ON TIME': return 100;
    case 'LATE': return 92;
    case 'VERY LATE': return 82;
    case 'OPENED': return 100;
    default: return 100;
  }
}

function hasOccurrence(value: string): boolean {
  return value !== '-' && value !== '' && value !== '0' && !!value;
}

export function transformTrips(sheetTrips: SheetTrip[]): Trip[] {
  // Filter out cancelled trips (driver_id === "0")
  const validTrips = sheetTrips.filter(st => st.driver_id && st.driver_id !== '0');

  console.log(`[DataAdapter] ${sheetTrips.length} total rows, ${validTrips.length} valid (filtered ${sheetTrips.length - validTrips.length} cancelled with driver_id=0)`);

  return validTrips.map((st, idx) => {
    const eta_origem = calcEtaPercent(st.eta_scheduled_origin_edited, st.eta_realizado, st.status_eta);
    const eta_destino = calcEtaPercent(st.eta_destination_edited, st.eta_destino_realizado, st.status_eta_destino);
    const cpt = calcCptPercent(st.cpt_scheduled_origin_edited, st.cpt_realizado, st.status_cpt);
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
      driver_id: st.driver_id,
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
