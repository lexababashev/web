import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { VideoItem } from './types';

interface VideoPlayerProps {
  hideControls: boolean;
  onEnded: () => void;
  onPlay: () => void;
  onToggleControls: () => void;
  currentVideo?: VideoItem | null;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ hideControls, onEnded, onPlay, onToggleControls, currentVideo }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    // Setup time update handler for trim functionality
    useEffect(() => {
      const handleTimeUpdate = () => {
        // If we have a video with trim points
        if (currentVideo && videoRef.current) {
          const currentTime = videoRef.current.currentTime;

          // If we've reached the trim end point
          if (
            currentVideo.trimEnd !== undefined &&
            currentTime >= currentVideo.trimEnd
          ) {
            // End this video and signal to move to the next
            videoRef.current.pause();
            onEnded();
          }
        }
      };

      // Add event listener for time updates
      const videoElement = videoRef.current;
      if (videoElement) {
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
      }

      // Cleanup event listener on unmount
      return () => {
        if (videoElement) {
          videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }, [currentVideo, onEnded]);

    // Set initial playback position when video or trim points change
    useEffect(() => {
      if (
        currentVideo &&
        videoRef.current &&
        currentVideo.trimStart !== undefined
      ) {
        videoRef.current.currentTime = currentVideo.trimStart;
      }
    }, [currentVideo]);

    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg h-[500px] md:h-[550px] flex items-center justify-center overflow-hidden relative">
        <video
          ref={videoRef}
          controls={!hideControls}
          className="w-full h-full object-contain"
          onEnded={onEnded}
          onPlay={onPlay}
          onClick={() => {
            if (hideControls) {
              // Toggle play/pause when video is clicked in hidden controls mode
              if (videoRef.current?.paused) {
                videoRef.current?.play();
              } else {
                videoRef.current?.pause();
                onToggleControls();
              }
            }
          }}
        />
        {hideControls && (
          <div
            className="absolute inset-0"
            onClick={() => {
              if (videoRef.current?.paused) {
                videoRef.current?.play();
              } else {
                videoRef.current?.pause();
                onToggleControls();
              }
            }}
          ></div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
