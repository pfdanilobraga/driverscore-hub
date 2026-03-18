import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { transformTrips, deriveDrivers, deriveBlocks, extractUniqueOccurrences, calculateTripScore, parseDateBR } from '@/services/dataAdapter';
import type { Trip, Driver, Block } from '@/data/mockData';
import { mockTrips, mockDrivers, mockBlocks } from '@/data/mockData';

interface EvaluationData {
  comunicacao: string;
  atendeu: boolean;
  desvio_rota: string;
  postura: string;
  ajuste_manual: number;
}

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DataContextType {
  trips: Trip[];
  drivers: Driver[];
  blocks: Block[];
  isLoading: boolean;
  isError: boolean;
  uniqueOccurrences: string[];
  ignoredOccurrences: string[];
  setIgnoredOccurrences: (v: string[]) => void;
  evaluateTrip: (tripId: string, evaluation: EvaluationData) => void;
  dateRange: DateRange;
  setDateRange: (v: DateRange) => void;
}

const DataContext = createContext<DataContextType>({
  trips: [],
  drivers: [],
  blocks: [],
  isLoading: true,
  isError: false,
  uniqueOccurrences: [],
  ignoredOccurrences: [],
  setIgnoredOccurrences: () => {},
  evaluateTrip: () => {},
  dateRange: { from: null, to: null },
  setDateRange: () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { data: sheetTrips, isLoading, isError } = useTrips();
  const [ignoredOccurrences, setIgnoredOccurrences] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, { ajuste: number }>>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  const uniqueOccurrences = useMemo(() => {
    if (sheetTrips && sheetTrips.length > 0) {
      return extractUniqueOccurrences(sheetTrips);
    }
    return [];
  }, [sheetTrips]);

  const { trips, drivers, blocks } = useMemo(() => {
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

      // Apply evaluations
      t = t.map(trip => {
        const ev = evaluations[trip.id];
        if (ev) {
          const adjusted = Math.max(0, Math.min(100, trip.score_final + ev.ajuste));
          return { ...trip, score_final: adjusted, evaluated: true };
        }
        return trip;
      });
      const d = deriveDrivers(t);
      const b = deriveBlocks(d);
      return { trips: t, drivers: d, blocks: b };
    }
    if (!isLoading) {
      return { trips: mockTrips, drivers: mockDrivers, blocks: mockBlocks };
    }
    return { trips: [] as Trip[], drivers: [] as Driver[], blocks: [] as Block[] };
  }, [sheetTrips, ignoredOccurrences, isLoading, evaluations, dateRange]);

  const evaluateTrip = useCallback((tripId: string, evaluation: EvaluationData) => {
    let ajuste = evaluation.ajuste_manual;
    // comunicacao
    if (evaluation.comunicacao === 'BOA') ajuste += 5;
    else if (evaluation.comunicacao === 'RUIM') ajuste -= 10;
    // atendeu
    if (!evaluation.atendeu) ajuste -= 10;
    // desvio
    if (evaluation.desvio_rota === 'LEVE') ajuste -= 10;
    else if (evaluation.desvio_rota === 'GRAVE') ajuste -= 20;
    // postura
    if (evaluation.postura === 'RUIM') ajuste -= 10;

    setEvaluations(prev => ({ ...prev, [tripId]: { ajuste } }));
  }, []);

  return (
    <DataContext.Provider value={{ trips, drivers, blocks, isLoading, isError, uniqueOccurrences, ignoredOccurrences, setIgnoredOccurrences, evaluateTrip, dateRange, setDateRange }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
