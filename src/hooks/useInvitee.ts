import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { inviteeService } from '../services/invitee.service';
import { CreateInviteeReq, InviteeRes } from '../types/invitee';

interface ErrorResponse {
  message: string;
}

export function useInvitee(eventId: string) {
  const queryClient = useQueryClient();

  const createInvitee = useMutation<
    InviteeRes[],
    AxiosError<ErrorResponse>,
    CreateInviteeReq
  >({
    mutationFn: (data) => inviteeService.createInvitee(data, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitees', eventId] });
    },
  });

  const getInvitees = useQuery({
    queryKey: ['invitees', eventId],
    queryFn: () => inviteeService.getInvitees(eventId),
    enabled: !!eventId,
  });

  const deleteInvitee = useMutation<void, AxiosError<ErrorResponse>, string>({
    mutationFn: (inviteeId) => inviteeService.deleteInvitee(eventId, inviteeId),
    onSuccess: (_, inviteeId) => {
      queryClient.setQueryData(
        ['invitees', eventId],
        (old: InviteeRes[] | undefined) => {
          if (!old) return [];
          return old.filter((invitee) => invitee.id !== inviteeId);
        }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['invitees', eventId] });
    },
  });

  return {
    createInvitee,
    getInvitees,
    deleteInvitee,
    isPending: createInvitee.isPending,
    isLoading: getInvitees.isLoading,
    isError: getInvitees.isError && getInvitees.error?.name !== '404',
    isEmpty:
      !getInvitees.isLoading &&
      !getInvitees.isError &&
      (!getInvitees.data || getInvitees.data.length === 0),
    invitees: getInvitees.data || [],
  };
}
