import { create } from 'zustand';
import { CalendarEvent } from '@/src/modules/core/components/calendar/AvailabilityCalendar';

interface UserState {
  availabilityEvents: CalendarEvent[];
  setAvailabilityEvents: (events: CalendarEvent[]) => void;
  isSavingAvailability: boolean;
  setIsSavingAvailability: (isSaving: boolean) => void;
  isMasterStatusToggling: boolean;
  setIsMasterStatusToggling: (toggling: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  availabilityEvents: [],
  setAvailabilityEvents: (events) => set({ availabilityEvents: events }),
  isSavingAvailability: false,
  setIsSavingAvailability: (isSaving) => set({ isSavingAvailability: isSaving }),
  isMasterStatusToggling: false,
  setIsMasterStatusToggling: (toggling) => set({ isMasterStatusToggling: toggling }),
}));
