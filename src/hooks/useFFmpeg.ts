import { useState } from 'react';
import { ffmpegService } from '../services/ffmpeg.service';
import { VideoItem } from '../../app/(auth)/video-editor/_components/types';

export const useFFmpeg = () => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const compileVideos = async (videos: VideoItem[]) => {
    setIsCompiling(true);
    setError(null);
    setProgress(0);

    try {
      const result = await ffmpegService.compileVideo(
        videos,
        (progressValue) => {
          setProgress(progressValue);
        }
      );
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compile video');
      throw err;
    } finally {
      setIsCompiling(false);
    }
  };

  return { compileVideos, isCompiling, error, progress };
};
