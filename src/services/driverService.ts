import { supabase } from '@/integrations/supabase/client';

export interface DriverRecord {
  id?: string;
  driver_id: string;
  driver_name: string;
  created_at?: string;
  updated_at?: string;
}

export type DriverMap = Record<string, { name: string }>;

export async function fetchDrivers(): Promise<DriverRecord[]> {
  const { data, error } = await supabase.from('drivers').select('*').order('driver_name');
  if (error) throw error;
  return (data || []) as unknown as DriverRecord[];
}

export function buildDriverMap(records: DriverRecord[]): DriverMap {
  const map: DriverMap = {};
  for (const r of records) {
    map[r.driver_id] = { name: r.driver_name };
  }
  return map;
}

export function resolveDriverName(driverId: string, originalName: string, driverMap: DriverMap): string {
  return driverMap[driverId]?.name || originalName;
}

export async function upsertDrivers(drivers: { driver_id: string; driver_name: string }[]): Promise<number> {
  let count = 0;
  // Batch upsert in chunks of 100
  for (let i = 0; i < drivers.length; i += 100) {
    const chunk = drivers.slice(i, i + 100);
    const { error } = await supabase
      .from('drivers')
      .upsert(
        chunk.map(d => ({
          driver_id: d.driver_id,
          driver_name: d.driver_name,
          updated_at: new Date().toISOString(),
        })) as any,
        { onConflict: 'driver_id' }
      );
    if (error) throw error;
    count += chunk.length;
  }
  return count;
}

export function parseDriverCSV(csv: string): { driver_id: string; driver_name: string }[] {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
  const idIdx = headers.findIndex(h => h === 'driver_id' || h === 'driverid' || h === 'id');
  const nameIdx = headers.findIndex(h => h === 'driver_name' || h === 'drivername' || h === 'name' || h === 'nome');

  if (idIdx === -1 || nameIdx === -1) return [];

  const result: { driver_id: string; driver_name: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    const did = cols[idIdx];
    const dname = cols[nameIdx];
    if (did && dname) {
      result.push({ driver_id: did, driver_name: dname });
    }
  }
  return result;
}
