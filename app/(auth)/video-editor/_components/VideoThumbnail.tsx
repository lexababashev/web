import { motion } from 'framer-motion';
import { TrashIcon, ScissorsIcon } from '@heroicons/react/24/outline';
import { VideoItem } from './types';
import { useState, useRef, useEffect } from 'react';

interface VideoThumbnailProps {
  video: VideoItem;
  index: number;
  isActive: boolean;
  isDragged: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onRemove: () => void;
  onTrim?: () => void; // Prop for handling trim actions
}

const VideoThumbnail = ({
  video,
  isActive,
  isDragged,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove,
  onTrim,
}: VideoThumbnailProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    // Close dropdown when scrolling
    const handleScroll = () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // true for capture phase to catch all scroll events

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isDropdownOpen]); // Add isDropdownOpen as dependency

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent thumbnail selection when clicking dropdown
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleMenuItemClick =
    (handler?: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (handler) handler();
      setIsDropdownOpen(false);
    };

  return (
    <motion.div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      animate={{
        scale: isDragged ? 0.95 : 1,
        opacity: isDragged ? 0.8 : 1,
      }}
      className={`flex-shrink-0 relative cursor-pointer hover:opacity-90 transition-all duration-200 ${
        isActive ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'
      }`}
    >
      <div className="w-[120px] h-[80px] rounded-xl shadow-lg overflow-hidden relative border-1 border-blue-600">
        {video.thumbnail ? (
          <div className="relative w-full h-full">
            <img
              src={video.thumbnail}
              alt={`Thumbnail for ${video.file.name}`}
              className="w-full h-full object-cover"
            />
            {/* Play overlay indication */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20">
              <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white text-xs flex items-center justify-center h-full bg-black">
            Loading...
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-1 bg-blue-600/60 text-white text-center">
          <div className="truncate font-medium text-[8px]">
            {video.file.name}
          </div>
        </div>

        <div className="absolute top-1 right-1 z-10" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="bg-blue-600/80 text-white rounded-full w-6 h-6 min-w-0 p-0 flex items-center justify-center hover:bg-blue-500 transition-colors shadow-sm"
          >
            <span className="text-[10px] font-bold">⋮</span>
          </button>

          {isDropdownOpen && (
            <div
              className="fixed mt-2 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px] z-50 overflow-hidden transition-all"
              style={{
                top: dropdownRef.current
                  ? dropdownRef.current.getBoundingClientRect().bottom + 0
                  : 0,
                left: dropdownRef.current
                  ? dropdownRef.current.getBoundingClientRect().left - 0
                  : 0,
              }}
            >
              <button
                className="flex items-center text-blue-600 text-sm py-2 px-3 hover:bg-blue-50 w-full text-left transition-colors duration-200"
                onClick={handleMenuItemClick(onTrim)}
              >
                <ScissorsIcon className="h-4 w-4 mr-2" />
                Trim
              </button>
              <div className="border-t border-gray-100"></div>
              <button
                className="flex items-center text-red-600 text-sm py-2 px-3 hover:bg-red-50 w-full text-left transition-colors duration-200"
                onClick={handleMenuItemClick(onRemove)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default VideoThumbnail;
