import api from '../api/axios';
import { CompiledUpload, Upload, UploadVideoRes } from '../types/upload';

export const uploadService = {
  async getInviteeUploads(
    eventId: string,
    inviteeId: string
  ): Promise<Upload[]> {
    const response = await api.get<Upload[]>(
      `/events/${eventId}/invitees/${inviteeId}/uploads`
    );
    return response.data;
  },

  async getEventUploads(eventId: string): Promise<Upload[]> {
    const response = await api.get<Upload[]>(`/events/${eventId}/uploads`);
    return response.data;
  },

  async getCompiledUpload(eventId: string): Promise<CompiledUpload[]> {
    const response = await api.get<CompiledUpload[]>(
      `/events/${eventId}/compiled/upload`
    );
    return response.data;
  },

  async uploadInviteeVideo(
    eventId: string,
    inviteeId: string,
    data: FormData
  ): Promise<UploadVideoRes> {
    const response = await api.post<UploadVideoRes>(
      `/events/${eventId}/invitees/${inviteeId}/upload`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async uploadOwnerVideo(
    eventId: string,
    data: FormData
  ): Promise<UploadVideoRes> {
    const response = await api.post<UploadVideoRes>(
      `/events/${eventId}/upload`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async uploadCompiledVideo(
    eventId: string,
    data: FormData
  ): Promise<UploadVideoRes> {
    const response = await api.post<UploadVideoRes>(
      `/events/${eventId}/compiled/upload`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async deleteUpload(eventId: string, uploadId: string): Promise<void> {
    await api.delete(`/events/${eventId}/uploads/${uploadId}`);
  },
};
