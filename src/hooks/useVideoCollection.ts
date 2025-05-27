import { useRef, useState, useEffect } from 'react';
import { VideoItem } from '@/(auth)/video-editor/_components/types';
import { Upload } from '../types/upload';

export const useVideoCollection = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [hasEditedTimeline, setHasEditedTimeline] = useState(false);
  const [trimVideoIndex, setTrimVideoIndex] = useState<number | null>(null);
  const [isLoadingUploads, setIsLoadingUploads] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total duration considering trim points
  const calculateTotalDuration = (videosList: VideoItem[]) => {
    let totalTime = 0;

    videosList.forEach((video) => {
      if (video.trimStart !== undefined && video.trimEnd !== undefined) {
        // Use trimmed duration
        totalTime += video.trimEnd - video.trimStart;
      } else {
        // Use full duration
        totalTime += video.duration || 0;
      }
    });

    return totalTime;
  };

  useEffect(() => {
    let totalTime = 0;
    const updatedVideos = videos.map((video) => {
      const startTime = totalTime;
      // Use trimmed duration for startTime calculations
      if (video.trimStart !== undefined && video.trimEnd !== undefined) {
        totalTime += video.trimEnd - video.trimStart;
      } else {
        totalTime += video.duration || 0;
      }
      return { ...video, startTime };
    });

    setVideos(updatedVideos);
    setTotalDuration(calculateTotalDuration(updatedVideos));
  }, [videos.length]);

  const handleUploadVideo = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const generateThumbnail = (videoUrl: string, videoId: string) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.currentTime = 0.5;
    video.crossOrigin = 'anonymous';

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 68;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg');

        setVideos((prevVideos) =>
          prevVideos.map((v) =>
            v.id === videoId ? { ...v, thumbnail: thumbnailUrl } : v
          )
        );
      }
    };
  };

  const getDuration = (videoUrl: string, videoId: string) => {
    const video = document.createElement('video');
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      const durationInSeconds = video.duration;

      setVideos((prevVideos) => {
        const updatedVideos = prevVideos.map((v) =>
          v.id === videoId
            ? {
                ...v,
                duration: durationInSeconds,
                // Set default trimEnd to the video duration if not already set
                trimEnd:
                  v.trimEnd === undefined ? durationInSeconds : v.trimEnd,
              }
            : v
        );

        // Use new calculation that respects trim points
        setTotalDuration(calculateTotalDuration(updatedVideos));

        return updatedVideos;
      });
    };
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
    setHasEditedTimeline(true);
    return true; // Indicates drag has started
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedItem === null) return false;

    const reorderedVideos = [...videos];
    const [draggedVideo] = reorderedVideos.splice(draggedItem, 1);
    reorderedVideos.splice(targetIndex, 0, draggedVideo);

    setVideos(reorderedVideos);
    setDraggedItem(null);
    setHasEditedTimeline(true);

    return true; // Drop successful
  };

  const handleRemoveVideo = (id: string) => {
    const videoToRemove = videos.find((v) => v.id === id);

    // Store the updated videos array to check if it's empty
    const updatedVideos = videos.filter((v) => v.id !== id);
    setVideos(updatedVideos);
    setHasEditedTimeline(true);

    if (videoToRemove?.url) {
      URL.revokeObjectURL(videoToRemove.url);
    }

    return updatedVideos.length;
  };

  const handleApplyTrim = (trimStart: number, trimEnd: number) => {
    if (trimVideoIndex !== null) {
      // Update the video with new trim points
      setVideos((prevVideos) => {
        const updatedVideos = prevVideos.map((video, idx) =>
          idx === trimVideoIndex ? { ...video, trimStart, trimEnd } : video
        );

        // Recalculate total duration after applying trim
        setTotalDuration(calculateTotalDuration(updatedVideos));

        return updatedVideos;
      });

      return true;
    }
    return false;
  };

  // New function to load uploaded videos from S3
  const loadUploadedVideos = async (uploads: Upload[]) => {
    if (!uploads || uploads.length === 0) return;

    setIsLoadingUploads(true);

    try {
      const newVideos: VideoItem[] = [];

      for (const upload of uploads) {
        try {
          const id = `s3-video-${upload.uploadId}`;

          // Check if this video is already loaded
          const existingVideo = videos.find(
            (v) => v.metadata?.uploadId === upload.uploadId
          );

          if (existingVideo) {
            // Video already exists in collection, reuse it
            newVideos.push(existingVideo);
            continue;
          }

          // This is a new video, fetch it from S3
          const response = await fetch(upload.uploadPath);
          const blob = await response.blob();

          // Create an object URL from the blob
          const url = URL.createObjectURL(blob);

          // Create a file object from the blob for compatibility with existing code
          const file = new File([blob], `${upload.inviteeName}-video.mp4`, {
            type: 'video/mp4',
          });

          const videoItem: VideoItem = {
            id,
            file,
            url,
            trimStart: 0,
            source: 'upload',
            metadata: {
              inviteeId: upload.inviteeId,
              uploadId: upload.uploadId,
              inviteeName: upload.inviteeName,
              uploadedAt: new Date(upload.uploadedAt),
            },
          };

          newVideos.push(videoItem);
        } catch (error) {
          // Handle error silently
        }
      }

      if (newVideos.length > 0) {
        setVideos((prevVideos) => {
          // Simply combine existing videos with new ones
          // Filter out any videos that would be duplicates of the new ones
          const uniqueExistingVideos = prevVideos.filter(
            (v) =>
              !newVideos.some(
                (newVideo) =>
                  newVideo.metadata?.uploadId === v.metadata?.uploadId
              )
          );

          const updatedVideos = [...uniqueExistingVideos, ...newVideos];
          return updatedVideos;
        });

        // Only process thumbnails and durations for newly loaded videos
        for (const video of newVideos) {
          // Only generate thumbnail and get duration for videos that aren't already processed
          if (!videos.some((v) => v.id === video.id && v.thumbnail)) {
            generateThumbnail(video.url, video.id);
            getDuration(video.url, video.id);
          }
        }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoadingUploads(false);
    }
  };

  useEffect(() => {
    // Only cleanup on component unmount, not when videos array changes
    return () => {
      // Clean up object URLs on component unmount
      videos.forEach((video) => {
        if (video.url) {
          URL.revokeObjectURL(video.url);
        }
      });
    };
  }, []); // Empty dependency array ensures this only runs on unmount

  return {
    videos,
    totalDuration,
    draggedItem,
    hasEditedTimeline,
    fileInputRef,
    trimVideoIndex,
    isLoadingUploads,
    setHasEditedTimeline,
    setTrimVideoIndex,
    handleUploadVideo,
    handleDragStart,
    handleDrop,
    handleRemoveVideo,
    handleApplyTrim,
    loadUploadedVideos,
    setVideos,
  };
};
