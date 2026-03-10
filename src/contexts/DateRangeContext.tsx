import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DateRangeType = 'today' | '7days' | '30days' | 'custom';

interface DateRangeContextType {
  dateRange: DateRangeType;
  setDateRange: (range: DateRangeType) => void;
  customRange: { start: Date | null; end: Date | null };
  setCustomRange: (range: { start: Date | null; end: Date | null }) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRangeType>('30days');
  const [customRange, setCustomRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, customRange, setCustomRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
}
