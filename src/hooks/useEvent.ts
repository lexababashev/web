import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { eventService } from '../services/event.service';
import {
  CreateEventReq,
  CreateEventRes,
  EventsByOwnerId,
  Event,
} from '../types/event';
import { useRouter } from 'next/navigation';

interface ErrorResponse {
  message: string;
}

export function useEvent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createEvent = useMutation<
    CreateEventRes,
    AxiosError<ErrorResponse>,
    CreateEventReq
  >({
    mutationFn: (data) => eventService.createEvent(data),
    onSuccess: (data) => {
      router.push(`/video-editor/${data.event_id}`);
    },
  });

  const getEvents = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents(),
    refetchOnWindowFocus: true,
  });

  const deleteEvent = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (eventId) => eventService.deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      queryClient.setQueryData(
        ['events'],
        (old: EventsByOwnerId[] | undefined) =>
          old ? old.filter((event) => event.id !== eventId) : [] // ← return
      );

      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const useGetEvent = (eventId: string) => {
    return useQuery<Event, AxiosError<ErrorResponse>>({
      queryKey: ['event', eventId],
      queryFn: () => eventService.getEvent(eventId),
      enabled: !!eventId,
    });
  };

  return {
    createEvent,
    getEvents,
    useGetEvent,
    deleteEvent,
    isPending: createEvent.isPending,
  };
}
