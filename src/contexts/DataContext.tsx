import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { transformTrips, deriveDrivers, deriveBlocks, extractUniqueOccurrences, parseDateBR } from '@/services/dataAdapter';
import { fetchEvaluations, upsertEvaluation, fetchDriverBlocks, unblockDriver as unblockDriverApi, createEvaluationLog, EvaluationRecord, DriverBlockRecord } from '@/services/supabaseService';
import { fetchDrivers, buildDriverMap, resolveDriverName, DriverMap } from '@/services/driverService';
import type { Trip, Driver, Block } from '@/data/mockData';
import { mockTrips, mockDrivers, mockBlocks } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export const DEFAULT_IGNORED_OCCURRENCES = [
  "Atraso na portaria Shopee",
  "Morosidade no carregamento",
  "Problema sistêmico Shopee (CTE/API)",
  "Saída antecipada do CPT - Early",
  "Solicitação Shopee para antecipação de chegada - Early",
];

const STORAGE_KEY = 'ignoredOccurrences';

function loadIgnored(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_IGNORED_OCCURRENCES;
}

interface EvaluationData {
  comunicacao: string;
  atendeu: boolean;
  desvio_rota: string;
  postura: string;
  ajuste_manual: number;
  observacao?: string;
  operador?: string;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DataContextType {
  trips: Trip[];
  drivers: Driver[];
  blocks: Block[];
  activeDrivers: Driver[];
  isLoading: boolean;
  isError: boolean;
  uniqueOccurrences: string[];
  ignoredOccurrences: string[];
  setIgnoredOccurrences: (v: string[]) => void;
  evaluateTrip: (tripId: string, driverId: string, driverName: string, evaluation: EvaluationData) => Promise<void>;
  unblockDriver: (driverId: string, driverName: string, operador: string) => Promise<void>;
  dateRange: DateRange;
  setDateRange: (v: DateRange) => void;
  evaluations: EvaluationRecord[];
  manualBlocks: DriverBlockRecord[];
  refreshData: () => void;
}

const DataContext = createContext<DataContextType>({
  trips: [],
  drivers: [],
  blocks: [],
  activeDrivers: [],
  isLoading: true,
  isError: false,
  uniqueOccurrences: [],
  ignoredOccurrences: [],
  setIgnoredOccurrences: () => {},
  evaluateTrip: async () => {},
  unblockDriver: async () => {},
  dateRange: { from: null, to: null },
  setDateRange: () => {},
  evaluations: [],
  manualBlocks: [],
  refreshData: () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { data: sheetTrips, isLoading, isError } = useTrips();
  const [ignoredOccurrences, setIgnoredOccurrencesRaw] = useState<string[]>(loadIgnored);

  const setIgnoredOccurrences = useCallback((v: string[]) => {
    setIgnoredOccurrencesRaw(v);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch {}
  }, []);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [manualBlocks, setManualBlocks] = useState<DriverBlockRecord[]>([]);
  const [driverMap, setDriverMap] = useState<DriverMap>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // Load persisted data from Supabase
  useEffect(() => {
    fetchEvaluations().then(setEvaluations).catch(console.error);
    fetchDriverBlocks().then(setManualBlocks).catch(console.error);
    fetchDrivers().then(records => setDriverMap(buildDriverMap(records))).catch(console.error);
  }, [refreshKey]);

  const refreshData = useCallback(() => setRefreshKey(k => k + 1), []);

  const uniqueOccurrences = useMemo(() => {
    if (sheetTrips && sheetTrips.length > 0) {
      return extractUniqueOccurrences(sheetTrips);
    }
    return [];
  }, [sheetTrips]);

  const { trips, drivers, blocks, activeDrivers } = useMemo(() => {
    if (sheetTrips && sheetTrips.length > 0) {
      let t = transformTrips(sheetTrips, ignoredOccurrences);

      // Apply date range filter
      if (dateRange.from || dateRange.to) {
        t = t.filter(trip => {
          const tripDate = parseDateBR(trip.data);
          if (!tripDate) return false;
          if (dateRange.from && tripDate < dateRange.from) return false;
          if (dateRange.to) {
            const endOfDay = new Date(dateRange.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (tripDate > endOfDay) return false;
          }
          return true;
        });
      }

      // Mark trips that have evaluations
      const evalMap = new Map(evaluations.map(e => [e.trip_id, e]));
      t = t.map(trip => {
        const ev = evalMap.get(trip.id);
        if (ev) {
          const ajuste = ev.ajuste_manual || 0;
          const adjusted = Math.max(0, Math.min(100, trip.score_final + ajuste));
          return { ...trip, score_final: adjusted, evaluated: true };
        }
        return trip;
      });

      // Check for manually unblocked drivers
      const unblockedDriverIds = new Set(
        manualBlocks.filter(b => !b.ativo).map(b => b.driver_id)
      );

      const d = deriveDrivers(t);
      
      // Override status for manually unblocked drivers
      const adjustedDrivers = d.map(driver => {
        if (unblockedDriverIds.has(driver.id) && driver.status === 'BLOQUEADO') {
          return { ...driver, status: 'ATIVO' as const };
        }
        return driver;
      });

      const b = deriveBlocks(adjustedDrivers);
      
      // RF04/RF05/RF06 — Exclude blocked drivers from ranking and metrics
      const active = adjustedDrivers.filter(dr => dr.status !== 'BLOQUEADO');

      return { trips: t, drivers: adjustedDrivers, blocks: b, activeDrivers: active };
    }
    if (!isLoading) {
      const active = mockDrivers.filter(d => d.status !== 'BLOQUEADO');
      return { trips: mockTrips, drivers: mockDrivers, blocks: mockBlocks, activeDrivers: active };
    }
    return { trips: [] as Trip[], drivers: [] as Driver[], blocks: [] as Block[], activeDrivers: [] as Driver[] };
  }, [sheetTrips, ignoredOccurrences, isLoading, evaluations, dateRange, manualBlocks]);

  const evaluateTrip = useCallback(async (tripId: string, driverId: string, driverName: string, evaluation: EvaluationData) => {
    const operador = evaluation.operador || 'Ana Costa';
    
    // Get existing evaluation for before state
    const existing = evaluations.find(e => e.trip_id === tripId);
    
    const record = {
      trip_id: tripId,
      driver_id: driverId,
      driver_name: driverName,
      comunicacao: evaluation.comunicacao,
      atendeu: evaluation.atendeu,
      desvio_rota: evaluation.desvio_rota,
      postura: evaluation.postura,
      ajuste_manual: evaluation.ajuste_manual,
      observacao: evaluation.observacao || '',
      operador,
    };

    await upsertEvaluation(record);

    // Log the action
    await createEvaluationLog({
      trip_id: tripId,
      driver_id: driverId,
      driver_name: driverName,
      operador,
      acao: existing ? 'EDIÇÃO' : 'CRIAÇÃO',
      dados_antes: existing ? (existing as unknown as Record<string, unknown>) : null,
      dados_depois: record as unknown as Record<string, unknown>,
    });

    refreshData();
  }, [evaluations, refreshData]);

  const unblockDriverFn = useCallback(async (driverId: string, driverName: string, operador: string) => {
    await unblockDriverApi(driverId, operador);
    
    await createEvaluationLog({
      driver_id: driverId,
      driver_name: driverName,
      operador,
      acao: 'DESBLOQUEIO',
      dados_antes: { status: 'BLOQUEADO' },
      dados_depois: { status: 'ATIVO' },
    });

    toast({ title: 'Motorista desbloqueado', description: `${driverName} voltou ao status ATIVO.` });
    refreshData();
  }, [refreshData, toast]);

  return (
    <DataContext.Provider value={{
      trips, drivers, blocks, activeDrivers, isLoading, isError,
      uniqueOccurrences, ignoredOccurrences, setIgnoredOccurrences,
      evaluateTrip, unblockDriver: unblockDriverFn,
      dateRange, setDateRange, evaluations, manualBlocks, refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
