import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, differenceInMilliseconds, startOfToday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type Schedulable = {
  start_date: string | null;
  end_date: string | null;
  completion: number;
  status: string;
};

export function getDynamicStatus(item: Schedulable) {
  if (!item.start_date || !item.end_date) {
    return {
      completion: item.completion || 0,
      expectedCompletion: item.completion || 0,
      status: item.status,
      isDelayed: false,
    };
  }

  const today = startOfToday();
  const startDate = new Date(item.start_date);
  const endDate = new Date(item.end_date);
  const manualCompletion = item.completion || 0;

  if (item.status === 'Completed' || manualCompletion === 100) {
    return {
      completion: 100,
      expectedCompletion: 100,
      status: 'Completed',
      isDelayed: false,
    };
  }
  
  if (today > endDate) {
      return {
          completion: manualCompletion,
          expectedCompletion: 100,
          status: 'Delayed',
          isDelayed: true,
      };
  }
  
  if (today < startDate) {
    return {
        completion: manualCompletion,
        expectedCompletion: 0,
        status: item.status, // Use manually set status like 'Planning'
        isDelayed: false,
    }
  }

  const totalDuration = differenceInMilliseconds(endDate, startDate);
  const elapsedDuration = differenceInMilliseconds(today, startDate);
  
  if (totalDuration <= 0) {
     return {
        completion: manualCompletion,
        expectedCompletion: manualCompletion,
        status: item.status,
        isDelayed: false,
     }
  }

  const expectedCompletion = Math.max(0, Math.min(100, Math.round((elapsedDuration / totalDuration) * 100)));

  return {
    completion: manualCompletion,
    expectedCompletion: expectedCompletion,
    status: item.status, // Use manually set status like 'On Track' or 'In Progress'
    isDelayed: false,
  };
}
