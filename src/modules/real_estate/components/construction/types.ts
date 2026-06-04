
export interface WorkerStatus {
  id: string;
  name: string;
  profession: string;
  isPresent: boolean;
  checkIn: string;
  checkOut: string;
  hourlyRate: number;
  workDescription: string;
  location: { x: number; y: number } | null;
}

export interface ResourceStatus {
  id: string;
  type: 'MEHANIZACIJA';
  name: string;
  amount: number;
  unit: string;
  unitPrice: number;
}

export interface CalendarEvent {
  id: string;
  day: number;
  endDay?: number;
  title: string;
  type: 'interview' | 'site' | 'meeting' | 'phase' | 'payment' | 'bill';
  color?: string;
}

export interface DayData {
  cost: number;
  hours: number;
  isAnomaly: boolean;
  isMilestone: boolean;
  workerCount: number;
}
