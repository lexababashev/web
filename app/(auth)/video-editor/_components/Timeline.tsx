import React, { useRef } from 'react';
import { VideoItem } from './types';
import VideoThumbnail from './VideoThumbnail';

interface TimelineProps {
  videos: VideoItem[];
  currentVideoIndex: number | null;
  totalDuration: number;
  onVideoSelect: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (index: number) => void;
  onRemoveVideo: (id: string) => void;
  onPlayAll: () => void;
  onTrimVideo?: (index: number) => void;
  draggedItem: number | null;
}

const Timeline = ({
  videos,
  currentVideoIndex,
  totalDuration,
  onVideoSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onRemoveVideo,
  onPlayAll,
  onTrimVideo,
  draggedItem,
}: TimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full max-w-4xl mb-6">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onPlayAll}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-md gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="Play all videos"
          disabled={videos.length === 0}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium text-sm">
            {formatTime(totalDuration)}
          </span>
        </button>

        <div
          ref={timelineRef}
          className="flex overflow-x-auto pb-2 pt-2 gap-2 w-full items-center"
          style={{
            scrollbarWidth: videos.length > 6 ? 'thin' : 'none',
            overflowY: 'hidden',
            height: '110px',
          }}
        >
          {videos.length === 0 ? (
            <div className="flex items-center justify-center w-full text-gray-500 text-sm">
              No videos added. Click "Upload Videos" to get started.
            </div>
          ) : (
            videos.map((video, index) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                index={index}
                isActive={currentVideoIndex === index}
                isDragged={draggedItem === index}
                onSelect={() => onVideoSelect(index)}
                onDragStart={() => onDragStart(index)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(index)}
                onRemove={() => onRemoveVideo(video.id)}
                onTrim={onTrimVideo ? () => onTrimVideo(index) : undefined}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
