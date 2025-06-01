import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from 'react';
import { Button } from '@heroui/button';
import { VideoItem } from './types';

// Range Slider component
interface CustomSliderProps {
  minValue: number;
  maxValue: number;
  value: [number, number];
  step?: number;
  onChange: (value: [number, number]) => void;
  className?: string;
  isDisabled?: boolean;
}

const CustomSlider = ({
  minValue,
  maxValue,
  value,
  step = 1,
  onChange,
  className = '',
  isDisabled = false,
}: CustomSliderProps) => {
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const range = maxValue - minValue;
  const startPercent = ((value[0] - minValue) / range) * 100;
  const endPercent = ((value[1] - minValue) / range) * 100;

  const handleMouseDown = (e: React.MouseEvent, thumb: 'min' | 'max') => {
    if (isDisabled) return;
    setActiveThumb(thumb);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (activeThumb && trackRef.current && !isDisabled) {
        const rect = trackRef.current.getBoundingClientRect();
        const percentage = Math.min(
          Math.max((e.clientX - rect.left) / rect.width, 0),
          1
        );
        const newValue = minValue + percentage * range;
        const roundedValue = Math.round(newValue / step) * step;

        if (activeThumb === 'min') {
          onChange([Math.min(roundedValue, value[1] - step), value[1]]);
        } else {
          onChange([value[0], Math.max(roundedValue, value[0] + step)]);
        }
      }
    };

    const handleMouseUp = () => {
      setActiveThumb(null);
    };

    if (activeThumb) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    activeThumb,
    value,
    minValue,
    maxValue,
    range,
    step,
    onChange,
    isDisabled,
  ]);

  return (
    <div ref={trackRef} className={`relative w-full h-4 ${className}`}>
      <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-gray-200 dark:bg-gray-800 rounded-full">
        {/* Selected range */}
        <div
          className="absolute h-full bg-blue-500 rounded-full"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`,
          }}
        />
      </div>

      {/* Start thumb */}
      <div
        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-blue-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-ew-resize hover:scale-110 transition-transform'}`}
        style={{ left: `${startPercent}%` }}
        onMouseDown={(e) => handleMouseDown(e, 'min')}
      />

      {/* End thumb */}
      <div
        className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-blue-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-ew-resize hover:scale-110 transition-transform'}`}
        style={{ left: `${endPercent}%` }}
        onMouseDown={(e) => handleMouseDown(e, 'max')}
      />
    </div>
  );
};

interface TrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTrim: (trimStart: number, trimEnd: number) => void;
  video: VideoItem | null;
}

const TrimModal = forwardRef<HTMLVideoElement, TrimModalProps>(
  ({ isOpen, onClose, onApplyTrim, video }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    // Initialize trim values when video changes
    useEffect(() => {
      if (video && isOpen) {
        setTrimStart(video.trimStart || 0);
        setTrimEnd(video.trimEnd || video.duration || 0);
        setDuration(video.duration || 0);

        // Reset video loading state
        setIsVideoLoaded(false);
        setIsVideoLoading(true);

        // Stop any current playback when changing videos
        if (videoRef.current && isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    }, [video, isOpen]);

    // Handle when the modal closes
    useEffect(() => {
      if (!isOpen && videoRef.current && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }, [isOpen, isPlaying]);

    // Handle time updates during playback
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        const newTime = videoRef.current.currentTime;
        setCurrentTime(newTime);

        // Loop back to trimStart if we reach trimEnd
        if (newTime >= trimEnd) {
          videoRef.current.currentTime = trimStart;
        }
      }
    };

    const handleSliderChange = (value: [number, number]) => {
      const [newTrimStart, newTrimEnd] = value;

      setTrimStart(newTrimStart);
      setTrimEnd(newTrimEnd);

      // Update video position when adjusting trim points
      if (videoRef.current && !isPlaying && isVideoLoaded) {
        videoRef.current.currentTime = newTrimStart;
        setCurrentTime(newTrimStart);
      }
    };

    const togglePlayback = () => {
      if (!videoRef.current || !isVideoLoaded) return;

      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Ensure we're at trimStart when starting playback
        if (currentTime < trimStart || currentTime > trimEnd) {
          videoRef.current.currentTime = trimStart;
          setCurrentTime(trimStart);
        }

        videoRef.current.play().catch((error) => {
          console.error('Failed to play video:', error);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    };

    const handleApplyTrim = () => {
      onApplyTrim(trimStart, trimEnd);
      onClose();
    };

    const handleVideoLoaded = () => {
      setIsVideoLoaded(true);
      setIsVideoLoading(false);

      if (videoRef.current && video) {
        // Set the current time to trim start when video is loaded
        videoRef.current.currentTime = video.trimStart || 0;
        setCurrentTime(video.trimStart || 0);
      }
    };

    // Handle video player click to toggle playback
    const handleVideoClick = () => {
      if (!videoRef.current || !isVideoLoaded) return;

      togglePlayback();
    };

    if (!isOpen || !video) return null;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal content */}
        <div className="relative z-10 w-full max-w-5xl mx-4 bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {video.file.name}
            </p>

            {/* Video player */}
            <div
              className="bg-black rounded-lg overflow-hidden mb-6 relative aspect-video cursor-pointer group"
              onClick={handleVideoClick}
            >
              <video
                ref={videoRef}
                src={video.url}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedData={handleVideoLoaded}
                onEnded={() => {
                  if (videoRef.current && isVideoLoaded) {
                    videoRef.current.currentTime = trimStart;
                    // Only try to play if it was already playing
                    if (isPlaying) {
                      videoRef.current
                        .play()
                        .catch((err) => console.error(err));
                    }
                  }
                }}
                preload="auto"
              />

              {/* Loading overlay */}
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Dark overlay when paused */}
              {isVideoLoaded && !isPlaying && (
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
              )}
            </div>

            {/* Trim controls */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>{formatTime(trimStart)}</span>
                <span>{formatTime(trimEnd)}</span>
              </div>

              <CustomSlider
                step={0.01}
                minValue={0}
                maxValue={duration}
                value={[trimStart, trimEnd]}
                onChange={handleSliderChange}
                className="mb-4"
                isDisabled={!isVideoLoaded}
              />

              <div className="flex justify-center text-sm text-gray-600 dark:text-gray-400">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                  Current: {formatTime(currentTime)}
                </span>
              </div>
            </div>

            {/*Apply Trim button*/}
            <div className="flex justify-center items-center mt-8">
              <Button
                color="primary"
                size="lg"
                onPress={handleApplyTrim}
                disabled={!isVideoLoaded}
                className="px-12 py-6 text-lg font-medium min-w-[200px]"
              >
                Apply Trim
              </Button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700 dark:text-gray-300"
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

TrimModal.displayName = 'TrimModal';

export default TrimModal;
