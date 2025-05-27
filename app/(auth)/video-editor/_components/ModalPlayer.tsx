import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from 'react';
import { VideoItem } from './types';

interface ModalPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onEnded: () => void;
  currentVideo?: VideoItem | null;
}

const ModalPlayer = forwardRef<HTMLVideoElement, ModalPlayerProps>(
  ({ isOpen, onClose, onEnded, currentVideo }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPaused, setIsPaused] = useState(true);

    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    // Setup time update handler for trim functionality
    useEffect(() => {
      const handleTimeUpdate = () => {
        // Handle trim points during playback
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

        // Track play/pause state
        const handlePlay = () => setIsPaused(false);
        const handlePause = () => setIsPaused(true);

        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);

        return () => {
          videoElement.removeEventListener('timeupdate', handleTimeUpdate);
          videoElement.removeEventListener('play', handlePlay);
          videoElement.removeEventListener('pause', handlePause);
        };
      }

      return undefined;
    }, [currentVideo, onEnded]);

    // Set initial playback position when video or trim points change
    useEffect(() => {
      if (
        currentVideo &&
        videoRef.current &&
        currentVideo.trimStart !== undefined
      ) {
        videoRef.current.currentTime = currentVideo.trimStart;

        // When a new video is loaded, we want to play it automatically and update the paused state
        videoRef.current
          .play()
          .catch((err) => console.error('Failed to play video:', err));
        setIsPaused(false);
      }
    }, [currentVideo]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="relative z-10 w-full max-w-5xl mx-4 bg-black rounded-xl overflow-hidden shadow-2xl">
          <div
            className="relative group cursor-pointer"
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current
                    .play()
                    .then(() => setIsPaused(false))
                    .catch((err) =>
                      console.error('Failed to play video:', err)
                    );
                } else {
                  videoRef.current.pause();
                  setIsPaused(true);
                }
              }
            }}
          >
            <video
              ref={videoRef}
              controls={false}
              className="w-full h-full object-contain"
              onEnded={onEnded}
            />

            {isPaused && (
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

ModalPlayer.displayName = 'ModalPlayer';

export default ModalPlayer;
