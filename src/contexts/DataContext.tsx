import { createContext, useContext, ReactNode } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { transformTrips, deriveDrivers, deriveBlocks } from '@/services/dataAdapter';
import type { Trip, Driver, Block } from '@/data/mockData';
import { mockTrips, mockDrivers, mockBlocks } from '@/data/mockData';

interface DataContextType {
  trips: Trip[];
  drivers: Driver[];
  blocks: Block[];
  isLoading: boolean;
  isError: boolean;
}

const DataContext = createContext<DataContextType>({
  trips: [],
  drivers: [],
  blocks: [],
  isLoading: true,
  isError: false,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { data: sheetTrips, isLoading, isError } = useTrips();

  let trips: Trip[];
  let drivers: Driver[];
  let blocks: Block[];

  if (sheetTrips && sheetTrips.length > 0) {
    trips = transformTrips(sheetTrips);
    drivers = deriveDrivers(trips);
    blocks = deriveBlocks(drivers);
  } else if (!isLoading) {
    // Fallback to mock data
    console.warn('[DataProvider] Using mock data as fallback');
    trips = mockTrips;
    drivers = mockDrivers;
    blocks = mockBlocks;
  } else {
    trips = [];
    drivers = [];
    blocks = [];
  }

  return (
    <DataContext.Provider value={{ trips, drivers, blocks, isLoading, isError }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
