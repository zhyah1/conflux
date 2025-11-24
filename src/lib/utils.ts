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
      status: item.status,
      isDelayed: false,
    };
  }

  const today = startOfToday();
  const startDate = new Date(item.start_date);
  const endDate = new Date(item.end_date);

  if (item.status === 'Completed' || item.completion === 100) {
    return {
      completion: 100,
      status: 'Completed',
      isDelayed: false,
    };
  }
  
  if (today > endDate) {
      return {
          completion: item.completion,
          status: 'Delayed',
          isDelayed: true,
      };
  }
  
  if (today < startDate) {
    return {
        completion: 0,
        status: 'Planning',
        isDelayed: false,
    }
  }

  const totalDuration = differenceInMilliseconds(endDate, startDate);
  const elapsedDuration = differenceInMilliseconds(today, startDate);
  
  if (totalDuration <= 0) {
     return {
        completion: item.completion,
        status: item.status,
        isDelayed: false,
     }
  }

  const expectedCompletion = Math.max(0, Math.min(100, Math.round((elapsedDuration / totalDuration) * 100)));
  
  const isDelayed = item.completion < expectedCompletion;

  return {
    completion: item.completion,
    status: isDelayed ? 'Delayed' : 'On Track',
    isDelayed: isDelayed,
  };
}
