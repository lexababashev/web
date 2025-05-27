import { useState, useRef } from 'react';
import { VideoItem } from '@/(auth)/video-editor/_components/types';

export const useVideoPlayback = (
  videos: VideoItem[],
  setHasEditedTimeline: (value: boolean) => void
) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [hasEditedTimeline, setHasEditedTimelineState] = useState(false);

  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const trimModalRef = useRef<HTMLVideoElement>(null);

  const handlePlayAllVideos = () => {
    if (videos.length === 0) return;

    // Open the modal when play all is clicked
    setIsModalOpen(true);
    setCurrentVideoIndex(0);

    // Stop the main player if it's playing
    if (videoPlayerRef.current) {
      videoPlayerRef.current.pause();
    }

    // Let the modal video handle playback
    setTimeout(() => {
      if (modalVideoRef.current && videos.length > 0) {
        modalVideoRef.current.src = videos[0].url;

        modalVideoRef.current.addEventListener(
          'loadeddata',
          function onLoaded() {
            modalVideoRef.current?.removeEventListener('loadeddata', onLoaded);

            // Set playback to start at trim point if defined
            if (videos[0].trimStart !== undefined && modalVideoRef.current) {
              modalVideoRef.current.currentTime = videos[0].trimStart;
            }

            modalVideoRef.current
              ?.play()
              .then(() => {
                setIsPlaying(true);
                setHideControls(true);
              })
              .catch((error) => console.error('Error playing video:', error));
          },
          { once: true }
        );
      }
    }, 100);
  };

  const handleVideoEnded = () => {
    if (currentVideoIndex === null || videos.length === 0) return;

    const nextIndex = currentVideoIndex + 1;

    if (nextIndex < videos.length) {
      setCurrentVideoIndex(nextIndex);

      // Handle the appropriate video player based on if modal is open
      const videoRef = isModalOpen ? modalVideoRef : videoPlayerRef;

      if (videoRef.current) {
        const nextVideo = videos[nextIndex];
        videoRef.current.src = nextVideo.url;

        // Wait for the video to load before playing
        videoRef.current.addEventListener(
          'loadeddata',
          function onLoaded() {
            videoRef.current?.removeEventListener('loadeddata', onLoaded);

            // Set playback to start at trim point if defined
            if (nextVideo.trimStart !== undefined && videoRef.current) {
              videoRef.current.currentTime = nextVideo.trimStart;
            }

            videoRef.current?.play().catch((error) => {
              console.error('Error transitioning to next video:', error);
            });
          },
          { once: true }
        );
      }
    } else {
      setIsPlaying(false);
      setHideControls(false); // Show controls when playback ends
      setCurrentVideoIndex(null);

      // Close modal when all videos finished playing
      if (isModalOpen) {
        setIsModalOpen(false);
      }
    }
  };

  const handleVideoPlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);

      if (videoPlayerRef.current && videos.length > 0 && hasEditedTimeline) {
        setCurrentVideoIndex(0);
        videoPlayerRef.current.src = videos[0].url;
        setHasEditedTimeline(false);
      }
    }
  };

  const handleTimelineCardClick = (index: number) => {
    if (videoPlayerRef.current) {
      // Pause the video first if it's currently playing
      if (isPlaying) {
        videoPlayerRef.current.pause();
      }

      // Set the current video index before changing the source
      setCurrentVideoIndex(index);

      const selectedVideo = videos[index];
      videoPlayerRef.current.src = selectedVideo.url;

      // Wait for the video to load before playing
      videoPlayerRef.current.addEventListener(
        'loadeddata',
        function onLoaded() {
          videoPlayerRef.current?.removeEventListener('loadeddata', onLoaded);

          // Set playback to start at trim point if defined
          if (selectedVideo.trimStart !== undefined && videoPlayerRef.current) {
            videoPlayerRef.current.currentTime = selectedVideo.trimStart;
          }

          // Add a slight delay before playing to ensure browser is ready
          setTimeout(() => {
            videoPlayerRef.current
              ?.play()
              .then(() => {
                setIsPlaying(true);
                setHideControls(false); // Show controls for normal playback
              })
              .catch((error) => console.error('Error playing video:', error));
          }, 100);
        },
        { once: true }
      );
    }
  };

  const handleTrimVideo = (index: number) => {
    // Pause any currently playing video
    if (isPlaying) {
      setIsPlaying(false);
      videoPlayerRef.current?.pause();
    }

    // Also pause the modal player if it's open
    if (isModalOpen && modalVideoRef.current) {
      modalVideoRef.current.pause();
    }

    setIsTrimModalOpen(true);
    return index;
  };

  const handleToggleControls = () => {
    setHideControls(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsPlaying(false);
    if (modalVideoRef.current) modalVideoRef.current.pause();
  };

  const pausePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      videoPlayerRef.current?.pause();
    }
  };

  return {
    currentVideoIndex,
    isPlaying,
    hideControls,
    isModalOpen,
    isTrimModalOpen,
    videoPlayerRef,
    modalVideoRef,
    trimModalRef,
    setCurrentVideoIndex,
    setIsPlaying,
    setIsModalOpen,
    setIsTrimModalOpen,
    handlePlayAllVideos,
    handleVideoEnded,
    handleVideoPlay,
    handleTimelineCardClick,
    handleTrimVideo,
    handleToggleControls,
    handleCloseModal,
    pausePlayback,
    hasEditedTimeline:
      videoPlayerRef.current && videos.length > 0 && hasEditedTimeline,
  };
};
