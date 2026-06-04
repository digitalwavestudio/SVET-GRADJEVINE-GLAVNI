import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/apiClient';

export interface CalendarEvent {
  id?: string;
  day: number;
  month: number;
  year: number;
  endDay?: number;
  title: string;
  type: 'interview' | 'site' | 'meeting' | 'phase' | 'payment' | 'bill';
  color?: string;
  hasAlarm?: boolean;
  authorId?: string;
  status?: string;
}

export function useCalendarNode(userId: string | undefined, currentDate: Date) {
  const queryClient = useQueryClient();
  const queryKey = ['calendar', userId || 'anonymous', currentDate.getMonth(), currentDate.getFullYear()];

  const { data: calendarData, isLoading: loading, refetch: fetchData } = useQuery<any>({
    queryKey,
    queryFn: async () => {
      const data = await apiClient.get<any>(`/calendar?month=${currentDate.getMonth()}&year=${currentDate.getFullYear()}`);
      if (!data) throw new Error("Failed to fetch calendar data");
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, 
  });

  const addEventMutation = useMutation({
    mutationFn: (eventData: CalendarEvent) => apiClient.post<any>(`/calendar`, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => apiClient.delete(`/calendar/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const saveDiaryMutation = useMutation({
    mutationFn: (payload: { day: number, content: string }) => 
      apiClient.post(`/calendar/diary`, {
        ...payload,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const events = calendarData?.events || [];
  const diaryLogs = calendarData?.diaries || {};
  const siteMetrics = calendarData?.metrics || { totalWorkers: 0, activeWorkers: 0, dailyCost: 0 };
  const aiShift = 0; // Keeping as dummy for now if needed by UI

  return {
    events,
    diaryLogs,
    siteMetrics,
    aiShift,
    loading,
    fetchData,
    addCalendarEvent: addEventMutation.mutateAsync,
    deleteCalendarEvent: deleteEventMutation.mutateAsync,
    saveDiaryEntry: (day: number, content: string) => saveDiaryMutation.mutateAsync({ day, content })
  };
}
