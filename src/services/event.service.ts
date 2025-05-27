import api from '../api/axios';
import {
  CreateEventReq,
  CreateEventRes,
  EventsByOwnerId,
  Event,
} from '../types/event';

export const eventService = {
  async createEvent(data: CreateEventReq): Promise<CreateEventRes> {
    const response = await api.post<CreateEventRes>('/events', data);
    return response.data;
  },
  async getEvents(): Promise<EventsByOwnerId[]> {
    const response = await api.get<EventsByOwnerId[]>(`/events`);
    return response.data || [];
  },
  async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/events/${eventId}`);
  },
  async getEvent(eventId: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${eventId}`);
    return response.data;
  },
};
