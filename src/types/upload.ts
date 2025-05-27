export interface UploadVideoReq {
  video: File;
}

export interface UploadVideoRes {
  message: string;
}

export interface Upload {
  inviteeId: string;
  uploadId: string;
  inviteeName: string;
  inviteSentAt: string;
  uploadPath: string;
  uploadedAt: string;
}

export interface CompiledUpload {
  uploadId: string;
  uploadPath: string;
  uploadedAt: string;
}
