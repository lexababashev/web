'use client';

import React from 'react';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { Header } from '@/components/ui/Header';
import VideoPlayer from '../_components/VideoPlayer';
import Timeline from '../_components/Timeline';
import ModalPlayer from '../_components/ModalPlayer';
import ShareButton from '../_components/ShareButton';
import TrimModal from '../_components/TrimModal';
import CompiledVideoView from '../_components/CompiledVideoView';
import { useEvent } from '@/src/hooks/useEvent';
import { useRouter } from 'next/navigation';
import { useVideoCollection } from '@/src/hooks/useVideoCollection';
import { useVideoPlayback } from '@/src/hooks/useVideoPlayback';
import { useVideoCompilation } from '@/src/hooks/useVideoCompilation';
import { useUpload } from '@/src/hooks/useUpload';
import { useUser } from '@/src/hooks/useUser';
import { AxiosError } from 'axios';

interface VideoEditorPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default function VideoEditorPage({ params }: VideoEditorPageProps) {
  const resolvedParams = React.use(params);
  const eventId = resolvedParams.eventId;

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const { useGetEvent } = useEvent();
  const {
    useGetEventUploads,
    uploadOwnerVideo,
    deleteUpload,
    useGetCompiledUpload,
  } = useUpload();
  const { data: eventData, isLoading: eventLoading } = useGetEvent(eventId);
  const {
    data: eventUploads,
    isLoading: uploadsLoading,
    isError: uploadsError,
  } = useGetEventUploads(eventId);

  // Check if there's an existing compiled video
  const { data: compiledUploads, isLoading: compiledUploadsLoading } =
    useGetCompiledUpload(eventId);

  const { data: user } = useUser();

  const router = useRouter();

  // Custom hooks for video functionality
  const videoCollection = useVideoCollection();
  const videoPlayback = useVideoPlayback(
    videoCollection.videos,
    videoCollection.setHasEditedTimeline
  );
  const videoCompilation = useVideoCompilation();

  // Function to dismiss error message
  const dismissError = () => setErrorMessage(null);

  // Load videos from S3 when uploads data changes
  React.useEffect(() => {
    if (
      eventUploads &&
      eventUploads.length > 0 &&
      !videoCollection.isLoadingUploads
    ) {
      videoCollection.loadUploadedVideos(eventUploads);
    }
  }, [eventUploads]);

  // Handle video compilation
  const handleCompile = async () => {
    try {
      await videoCompilation.handleCompile(videoCollection.videos);
    } catch (error) {
      setErrorMessage(
        `Failed to compile video: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Handle file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoPlayback.isPlaying) {
      videoPlayback.setIsPlaying(false);
      videoPlayback.videoPlayerRef.current?.pause();
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file.');
      return;
    }

    if (file.type !== 'video/mp4') {
      setErrorMessage('Please select an MP4 video file.');
      return;
    }

    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File size exceeds 50MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
      );
      return;
    }

    // Check if event owner already has uploads
    if (eventUploads && eventUploads.length > 0) {
      const ownerUploads = eventUploads.filter(
        (upload) => upload.inviteeName === user?.username
      );
      if (ownerUploads.length > 0) {
        setErrorMessage(
          'You already have a video uploaded. Please delete your existing video before uploading a new one.'
        );
        // Reset the file input
        if (videoCollection.fileInputRef.current) {
          videoCollection.fileInputRef.current.value = '';
        }
        return;
      }
    }

    // Clear previous errors
    setErrorMessage(null);

    try {
      // Upload the file
      await uploadOwnerVideo.mutateAsync({
        eventId,
        file: file,
      });

      setErrorMessage(null);
    } catch (error) {
      // Reset the file input
      if (videoCollection.fileInputRef.current) {
        videoCollection.fileInputRef.current.value = '';
      }

      setErrorMessage(
        `${error instanceof AxiosError ? error.response?.data?.message : 'Failed to process video file'}`
      );
    }

    // Reset the file input
    if (videoCollection.fileInputRef.current) {
      videoCollection.fileInputRef.current.value = '';
    }
  };

  // Handle video trim
  const handleTrimVideo = (index: number) => {
    try {
      const trimIndex = videoPlayback.handleTrimVideo(index);
      videoCollection.setTrimVideoIndex(trimIndex);
    } catch (error) {
      setErrorMessage(
        `Failed to trim video: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Handle apply trim
  const handleApplyTrim = (trimStart: number, trimEnd: number) => {
    try {
      const success = videoCollection.handleApplyTrim(trimStart, trimEnd);

      // If the video being trimmed is currently playing, update its playback position
      if (
        success &&
        videoPlayback.currentVideoIndex === videoCollection.trimVideoIndex &&
        videoPlayback.videoPlayerRef.current
      ) {
        videoPlayback.videoPlayerRef.current.currentTime = trimStart;
      }
    } catch (error) {
      setErrorMessage(
        `Failed to apply trim: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Handle remove video
  const handleRemoveVideo = async (id: string) => {
    if (videoPlayback.isPlaying) {
      videoPlayback.setIsPlaying(false);
      videoPlayback.videoPlayerRef.current?.pause();
    }

    try {
      // Find the video to be removed to check if it's an uploaded video
      const videoToRemove = videoCollection.videos.find(
        (video) => video.id === id
      );

      // Check if this is an uploaded video with metadata
      if (
        videoToRemove?.source === 'upload' &&
        videoToRemove?.metadata?.uploadId
      ) {
        try {
          await deleteUpload.mutateAsync({
            eventId,
            uploadId: videoToRemove.metadata.uploadId,
          });
        } catch (error) {
          throw new Error(
            `${error instanceof AxiosError ? error.response?.data?.message : 'Failed to remove video'}`
          );
        }
      }

      const videosCount = videoCollection.handleRemoveVideo(id);

      // Clear the video player source if no videos left
      if (videosCount === 0 && videoPlayback.videoPlayerRef.current) {
        videoPlayback.videoPlayerRef.current.src = '';
        videoPlayback.setCurrentVideoIndex(null);
      } else {
        videoPlayback.setCurrentVideoIndex(null);
      }
    } catch (error) {
      setErrorMessage(
        `${error instanceof AxiosError ? error.response?.data?.message : 'Failed to remove video'}`
      );
    }
  };

  // Handle drag start
  const handleDragStart = (index: number) => {
    try {
      const isDragStarted = videoCollection.handleDragStart(index);

      if (isDragStarted && videoPlayback.isPlaying) {
        videoPlayback.setIsPlaying(false);
        videoPlayback.videoPlayerRef.current?.pause();
      }
    } catch (error) {
      setErrorMessage(
        `Failed to start drag operation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Redirect to dashboard if event is not found
  React.useEffect(() => {
    if (!eventLoading && !eventData) {
      router.push('/dashboard');
    }
  }, [eventLoading, eventData, router]);

  // If we're still checking for existing compiled videos, show loading state
  if (compiledUploadsLoading) {
    return (
      <main className="flex min-h-screen flex-col">
        <Header showBackButton={true} backText="Dashboard" />
        <div className="flex flex-col justify-center items-center pt-24 px-6 w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-center text-gray-600">Loading event data...</p>
        </div>
      </main>
    );
  }

  // If compilation just completed, show the compiled video view
  if (videoCompilation.isCompilationComplete) {
    return (
      <CompiledVideoView
        compiledVideoBlob={videoCompilation.compiledVideoBlob}
        eventId={eventId}
      />
    );
  }

  // If there's an existing compiled video, show the CompiledVideoView
  if (compiledUploads && compiledUploads.length > 0) {
    return (
      <CompiledVideoView
        compiledVideoUrl={compiledUploads[0].uploadPath}
        eventId={eventId}
      />
    );
  }

  // Otherwise, show the video editor
  return (
    <main className="flex min-h-screen flex-col">
      <Header
        actions={<ShareButton eventId={eventId} />}
        showBackButton={true}
        backText="Dashboard"
      />

      <div className="flex flex-col justify-center items-center pt-24 px-6 pb-12 w-full max-w-5xl mx-auto">
        <input
          type="file"
          ref={videoCollection.fileInputRef}
          accept="video/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
          {eventLoading ? 'Loading...' : eventData?.name}
        </h1>

        <div className="w-full max-w-6xl mb-6">
          <VideoPlayer
            ref={videoPlayback.videoPlayerRef}
            hideControls={videoPlayback.hideControls}
            onEnded={videoPlayback.handleVideoEnded}
            onPlay={videoPlayback.handleVideoPlay}
            onToggleControls={videoPlayback.handleToggleControls}
            currentVideo={
              videoPlayback.currentVideoIndex !== null
                ? videoCollection.videos[videoPlayback.currentVideoIndex]
                : null
            }
          />
        </div>

        <Timeline
          videos={videoCollection.videos}
          currentVideoIndex={videoPlayback.currentVideoIndex}
          totalDuration={videoCollection.totalDuration}
          onVideoSelect={videoPlayback.handleTimelineCardClick}
          onDragStart={handleDragStart}
          onDragOver={(e) => e.preventDefault()}
          onDrop={videoCollection.handleDrop}
          onRemoveVideo={handleRemoveVideo}
          onPlayAll={videoPlayback.handlePlayAllVideos}
          onTrimVideo={handleTrimVideo}
          draggedItem={videoCollection.draggedItem}
        />

        <div className="w-full max-w-4xl flex flex-col md:flex-row gap-4 justify-center mb-4">
          <Button
            color="primary"
            variant="flat"
            size="lg"
            onPress={videoCollection.handleUploadVideo}
            className="flex-1 text-blue-900"
          >
            Upload Videos
          </Button>

          <Button
            color="primary"
            size="lg"
            isLoading={videoCompilation.isCompiling}
            onPress={handleCompile}
            className="flex-1"
            disabled={videoCollection.videos.length === 0}
          >
            {videoCompilation.isCompiling
              ? 'Compiling Video...'
              : 'Compile Video'}
          </Button>
        </div>

        {/* Error message display */}
        {errorMessage && (
          <div className="w-full max-w-4xl mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{errorMessage}</span>
            <span
              className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
              onClick={dismissError}
            >
              <svg
                className="fill-current h-6 w-6 text-red-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        {(uploadsLoading || videoCollection.isLoadingUploads) && (
          <div className="w-full max-w-4xl mb-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700 mr-3"></div>
              <p className="text-sm text-gray-600">
                Loading uploaded videos...
              </p>
            </div>
          </div>
        )}

        {uploadsError && (
          <div className="w-full max-w-4xl mb-4">
            <p className="text-sm text-red-600 text-center">
              Error loading uploaded videos. Please try again.
            </p>
          </div>
        )}

        {videoCompilation.isCompiling && (
          <div className="w-full max-w-4xl mb-8">
            <Progress
              value={videoCompilation.progress}
              color="primary"
              className="mb-2"
              aria-label="Compilation progress"
            />
            <p className="text-sm text-center text-gray-600">
              {videoCompilation.progress}% Complete
            </p>
          </div>
        )}

        <ModalPlayer
          ref={videoPlayback.modalVideoRef}
          isOpen={videoPlayback.isModalOpen}
          onClose={videoPlayback.handleCloseModal}
          onEnded={videoPlayback.handleVideoEnded}
          currentVideo={
            videoPlayback.currentVideoIndex !== null
              ? videoCollection.videos[videoPlayback.currentVideoIndex]
              : null
          }
        />

        <TrimModal
          ref={videoPlayback.trimModalRef}
          isOpen={videoPlayback.isTrimModalOpen}
          onClose={() => videoPlayback.setIsTrimModalOpen(false)}
          onApplyTrim={handleApplyTrim}
          video={
            videoCollection.trimVideoIndex !== null
              ? videoCollection.videos[videoCollection.trimVideoIndex]
              : null
          }
        />
      </div>
    </main>
  );
}
