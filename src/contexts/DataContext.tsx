import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { transformTrips, deriveDrivers, deriveBlocks, extractUniqueOccurrences } from '@/services/dataAdapter';
import type { Trip, Driver, Block } from '@/data/mockData';
import { mockTrips, mockDrivers, mockBlocks } from '@/data/mockData';

interface DataContextType {
  trips: Trip[];
  drivers: Driver[];
  blocks: Block[];
  isLoading: boolean;
  isError: boolean;
  uniqueOccurrences: string[];
  ignoredOccurrences: string[];
  setIgnoredOccurrences: (v: string[]) => void;
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
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { data: sheetTrips, isLoading, isError } = useTrips();
  const [ignoredOccurrences, setIgnoredOccurrences] = useState<string[]>([]);

  const uniqueOccurrences = useMemo(() => {
    if (sheetTrips && sheetTrips.length > 0) {
      return extractUniqueOccurrences(sheetTrips);
    }
    return [];
  }, [sheetTrips]);

  const { trips, drivers, blocks } = useMemo(() => {
    if (sheetTrips && sheetTrips.length > 0) {
      const t = transformTrips(sheetTrips, ignoredOccurrences);
      const d = deriveDrivers(t);
      const b = deriveBlocks(d);
      return { trips: t, drivers: d, blocks: b };
    }
    if (!isLoading) {
      return { trips: mockTrips, drivers: mockDrivers, blocks: mockBlocks };
    }
    return { trips: [] as Trip[], drivers: [] as Driver[], blocks: [] as Block[] };
  }, [sheetTrips, ignoredOccurrences, isLoading]);

  return (
    <DataContext.Provider value={{ trips, drivers, blocks, isLoading, isError, uniqueOccurrences, ignoredOccurrences, setIgnoredOccurrences }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
