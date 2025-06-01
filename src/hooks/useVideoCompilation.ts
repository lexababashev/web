import { useState } from 'react';
import { VideoItem } from '@/(auth)/video-editor/_components/types';
import { useFFmpeg } from './useFFmpeg';

export const useVideoCompilation = () => {
  const { compileVideos, isCompiling, error, progress } = useFFmpeg();
  const [isCompilationComplete, setIsCompilationComplete] = useState(false);
  const [compiledVideoUrl, setCompiledVideoUrl] = useState('');
  const [compiledVideoBlob, setCompiledVideoBlob] = useState<Blob | null>(null);

  const handleCompile = async (videos: VideoItem[]) => {
    if (videos.length === 0) {
      alert('Please add videos to compile');
      return false;
    }

    try {
      const compiledBlob = await compileVideos(videos);

      // Store the blob for later use in upload
      setCompiledVideoBlob(compiledBlob);

      // Create URL for the compiled video
      const url = URL.createObjectURL(compiledBlob);

      // Set the compiled video URL and complete flag
      setCompiledVideoUrl(url);
      setIsCompilationComplete(true);
      return true;

      // We don't revoke the URL here as we need it for the player
    } catch (err) {
      alert(error || 'Failed to compile video.');
      return false;
    }
  };

  // Clean up function to be called when the component using this hook unmounts
  const cleanup = () => {
    if (compiledVideoUrl) {
      URL.revokeObjectURL(compiledVideoUrl);
      setCompiledVideoUrl('');
      setCompiledVideoBlob(null);
      setIsCompilationComplete(false);
    }
  };

  return {
    isCompiling,
    error,
    progress,
    isCompilationComplete,
    compiledVideoUrl,
    compiledVideoBlob,
    handleCompile,
    cleanup,
  };
};
