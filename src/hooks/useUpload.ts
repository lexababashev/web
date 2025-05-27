import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { uploadService } from '../services/upload.service';
import { CompiledUpload, Upload, UploadVideoRes } from '../types/upload';

interface ErrorResponse {
  message: string;
}

export function useUpload() {
  const queryClient = useQueryClient();

  const useGetInviteeUploads = (eventId: string, inviteeId: string) => {
    return useQuery<Upload[], AxiosError<ErrorResponse>>({
      queryKey: ['invitee-uploads', eventId, inviteeId],
      queryFn: () => uploadService.getInviteeUploads(eventId, inviteeId),
      enabled: !!eventId && !!inviteeId,
    });
  };

  const useGetEventUploads = (eventId: string) => {
    return useQuery<Upload[], AxiosError<ErrorResponse>>({
      queryKey: ['event-uploads', eventId],
      queryFn: () => uploadService.getEventUploads(eventId),
      enabled: !!eventId,
      refetchOnWindowFocus: true,
    });
  };

  const useGetCompiledUpload = (eventId: string) => {
    return useQuery<CompiledUpload[], AxiosError<ErrorResponse>>({
      queryKey: ['compiled-upload', eventId],
      queryFn: () => uploadService.getCompiledUpload(eventId),
      enabled: !!eventId,
    });
  };

  const uploadInviteeVideo = useMutation<
    UploadVideoRes,
    AxiosError<ErrorResponse>,
    { eventId: string; inviteeId: string; file: File }
  >({
    mutationFn: ({ eventId, inviteeId, file }) => {
      const formData = new FormData();

      formData.append('video', file);

      return uploadService.uploadInviteeVideo(eventId, inviteeId, formData);
    },
  });

  const uploadOwnerVideo = useMutation<
    UploadVideoRes,
    AxiosError<ErrorResponse>,
    { eventId: string; file: File }
  >({
    mutationFn: ({ eventId, file }) => {
      const formData = new FormData();

      formData.append('video', file);

      return uploadService.uploadOwnerVideo(eventId, formData);
    },
    onSuccess: (_, variables) => {
      // Invalidate the event-uploads query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ['event-uploads', variables.eventId],
      });
    },
  });

  const uploadCompiledVideo = useMutation<
    UploadVideoRes,
    AxiosError<ErrorResponse>,
    { eventId: string; file: File }
  >({
    mutationFn: ({ eventId, file }) => {
      const formData = new FormData();
      formData.append('video', file);
      return uploadService.uploadCompiledVideo(eventId, formData);
    },
  });

  const deleteUpload = useMutation<
    void,
    AxiosError<ErrorResponse>,
    { eventId: string; uploadId: string }
  >({
    mutationFn: ({ eventId, uploadId }) => {
      return uploadService.deleteUpload(eventId, uploadId);
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData(
        ['event-uploads', variables.eventId],
        (old: Upload[] | undefined) =>
          old
            ? old.filter((upload) => upload.uploadId !== variables.uploadId)
            : []
      );

      queryClient.invalidateQueries({
        queryKey: ['event-uploads', variables.eventId],
      });
    },
  });

  return {
    useGetInviteeUploads,
    uploadInviteeVideo,
    uploadOwnerVideo,
    uploadCompiledVideo,
    useGetEventUploads,
    deleteUpload,
    useGetCompiledUpload,
  };
}
