import api from '../api/axios';
import { CreateInviteeReq, InviteeRes } from '../types/invitee';

export const inviteeService = {
  createInvitee: async (data: CreateInviteeReq, eventId: string) => {
    const response = await api.post<InviteeRes[]>(
      `/events/${eventId}/invitees`,
      data
    );
    return response.data;
  },

  getInvitees: async (eventId: string) => {
    const response = await api.get<InviteeRes[]>(`/events/${eventId}/invitees`);
    return response.data;
  },

  deleteInvitee: async (eventId: string, inviteeId: string) => {
    await api.delete<void>(`/events/${eventId}/invitees/${inviteeId}`);
  },
};
