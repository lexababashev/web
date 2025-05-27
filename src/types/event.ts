export interface CreateEventReq {
  name: string;
  deadline: number;
}

export interface CreateEventRes {
  event_id: string;
}

export interface EventsByOwnerId {
  id: string;
  name: string;
  deadline: number;
  createdAt: number;
}

export interface Event {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  deadline: Date;
}
