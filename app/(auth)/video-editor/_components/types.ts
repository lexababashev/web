export interface VideoItem {
  id: string;
  file: File;
  url: string;
  thumbnail?: string;
  duration?: number;
  startTime?: number; // For tracking position in the combined sequence
  trimStart?: number; // For trim feature - defaults to 0 when not set
  trimEnd?: number; // For trim feature - defaults to full duration when not set
  source?: 'upload' | 'local'; // To distinguish between S3 uploaded videos and locally uploaded ones
  metadata?: {
    inviteeId?: string;
    uploadId?: string;
    inviteeName?: string;
    uploadedAt?: Date;
  }; // Additional metadata for uploaded videos
}

export interface VideoPlayerRefType {
  play: () => Promise<void>;
  pause: () => void;
  src: string;
  paused: boolean;
}
