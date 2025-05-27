'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@heroui/button';
import { Header } from '@/components/ui/Header';
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useUpload } from '@/src/hooks/useUpload';
import { useParams } from 'next/navigation';
import { AxiosError } from 'axios';

interface CompiledVideoViewProps {
  compiledVideoUrl?: string;
  compiledVideoBlob?: Blob | null; // Add blob prop to prevent refetching
  eventId?: string; // Make eventId optional to support both direct use and passing from parent
}

export default function CompiledVideoView({
  compiledVideoUrl,
  compiledVideoBlob,
  eventId: propsEventId,
}: CompiledVideoViewProps) {
  const params = useParams();
  // Use eventId from props if provided, otherwise try to get it from route params
  const eventId = propsEventId || (params?.eventId as string);

  const [isCopied, setIsCopied] = useState(false);
  const [copyAnimation, setCopyAnimation] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    'uploading' | 'completed' | 'error'
  >('uploading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareableUrl, setShareableUrl] = useState<string>('');
  const [videoSource, setVideoSource] = useState<string>('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Refs to prevent multiple uploads and state flickering
  const hasUploadStarted = useRef(false);
  const hasUploadFinished = useRef(false);
  const videoObjectUrl = useRef<string | null>(null);

  const { uploadCompiledVideo, useGetCompiledUpload } = useUpload();
  const { data: compiledUploadData } = useGetCompiledUpload(eventId);

  // Clean up any object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any created object URLs when component unmounts
      if (videoObjectUrl.current) {
        URL.revokeObjectURL(videoObjectUrl.current);
      }
    };
  }, []);

  // Set up video source from blob or URL
  useEffect(() => {
    // Clear previous video source to show loading state
    setVideoSource('');
    
    // First clean up any existing object URL
    if (videoObjectUrl.current) {
      URL.revokeObjectURL(videoObjectUrl.current);
      videoObjectUrl.current = null;
    }

    const setupVideoSource = async () => {
      setIsLoadingVideo(true);
      

        if (compiledVideoBlob) {
          // If we have a blob, create an object URL from it
          const url = URL.createObjectURL(compiledVideoBlob);
          videoObjectUrl.current = url;
          setVideoSource(url);
        } else if (compiledVideoUrl) {
          try {
            const response = await fetch(compiledVideoUrl);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch video: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            videoObjectUrl.current = url;
            setVideoSource(url);
          } catch (error) {
            setErrorMessage(`Error loading video: ${error instanceof AxiosError ? error.response?.data?.message : 'Failed to upload video'}`);
          }
        }   
          
            

        setIsLoadingVideo(false);
      
    };

    if (compiledVideoBlob || compiledVideoUrl) {
      setupVideoSource();
    }
  }, [compiledVideoBlob, compiledVideoUrl]);

  // Check if a compiled video already exists for this event
  useEffect(() => {
    if (compiledUploadData && compiledUploadData.length > 0) {
      // If we already have a compiled video upload and we're just viewing it (no new blob)
      if (!compiledVideoBlob) {
        // Set status to completed and create shareable URL
        setUploadStatus('completed');
        hasUploadFinished.current = true;
        const shareUrl = `${window.location.origin}/compiled/${eventId}`;
        setShareableUrl(shareUrl);
      }
    }
  }, [compiledUploadData, compiledVideoBlob, eventId]);

  // Upload the compiled video when component mounts
  useEffect(() => {
    // Skip if already started or completed or if there's no blob to upload
    if (
      hasUploadStarted.current ||
      hasUploadFinished.current ||
      !compiledVideoBlob ||
      (compiledUploadData && compiledUploadData.length > 0) // Skip if compiled video already exists
    ) {
      return;
    }

    const uploadVideo = async () => {
      // Set flag to prevent multiple attempts
      hasUploadStarted.current = true;

      try {
        // Create a file from the blob
        const file = new File(
          [compiledVideoBlob],
          `compiled-video-${Date.now()}.mp4`,
          { type: 'video/mp4' }
        );

        // Upload the video to the server
        await uploadCompiledVideo.mutateAsync({
          eventId,
          file,
        });

        // Create shareable URL
        const shareUrl = `${window.location.origin}/compiled/${eventId}`;
        setShareableUrl(shareUrl);

        setUploadStatus('completed');
        hasUploadFinished.current = true;
      } catch (error) {
        // Handle Axios errors
        if (error instanceof AxiosError) {
          const errorMsg =
            error.response?.data?.message || 'Failed to upload video';
          setErrorMessage(errorMsg);
        } else {
          setErrorMessage('Failed to upload video');
        }

        setUploadStatus('error');
        hasUploadFinished.current = true;
      }
    };

    if (eventId && compiledVideoBlob) {
      uploadVideo();
    }
  }, [compiledVideoBlob, eventId, uploadCompiledVideo, compiledUploadData]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setIsCopied(true);
      setCopyAnimation(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {

    }
  };

  // Reset animation state after animation completes
  useEffect(() => {
    if (copyAnimation) {
      const timer = setTimeout(() => {
        setCopyAnimation(false);
      }, 800); // Match the animation duration
      return () => clearTimeout(timer);
    }
  }, [copyAnimation]);

  const handleDownload = () => {
    if (!videoSource) return;

    // Create download link
    const a = document.createElement('a');
    a.href = videoSource;
    a.download = `compiled-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <main className="flex min-h-screen flex-col">
      <Header
        showBackButton={true}
        backText="Dashboard"
        actions={
          <Button
            color="primary"
            variant="light"
            onPress={handleDownload}
            className="flex items-center gap-1"
            isDisabled={!videoSource}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download Video
          </Button>
        }
      />

      <div className="flex flex-col justify-center items-center pt-24 px-6 pb-12 w-full max-w-5xl mx-auto">
        <div className="w-full max-w-6xl mb-10">
          {videoSource ? (
            <video
              src={videoSource}
              controls
              playsInline
              className="w-full rounded-lg shadow-lg"
              onError={(e) => {
                console.error("Video playback error:", e);
                setErrorMessage("Error playing video. Please try downloading instead.");
              }}
            />
          ) : isLoadingVideo ? (
            <div className="w-full aspect-video bg-gray-200 rounded-lg shadow-lg flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600">Loading video...</p>
            </div>
          ) : errorMessage ? (
            <div className="w-full aspect-video bg-gray-100 rounded-lg shadow-lg flex flex-col items-center justify-center p-6">
              <div className="text-red-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-center text-red-600 font-medium">{errorMessage}</p>
            </div>
          ) : (
            <div className="w-full aspect-video bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        {uploadStatus === 'uploading' && !hasUploadFinished.current ? (
          <div className="w-full max-w-4xl mb-8">
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-xl font-bold text-center">
                Uploading video...
              </h2>
            </div>

            <div className="w-full">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>

              <p className="text-sm text-center text-gray-600">
                Uploading your video to the server...
              </p>
            </div>
          </div>
        ) : uploadStatus === 'error' ? (
          <div className="w-full max-w-4xl mb-8">
            <div className="flex items-center justify-center mb-4 text-red-500">
              <h2 className="text-xl font-bold text-center">
                Failed to upload video
              </h2>
            </div>
            {errorMessage && (
              <p className="text-sm text-center text-red-500 mb-4">
                {errorMessage}
              </p>
            )}
            <p className="text-sm text-center text-gray-600">
              You can still download the video using the button above.
            </p>
          </div>
        ) : uploadStatus === 'completed' || hasUploadFinished.current ? (
          <>
            <div className="flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mr-2" />
              <h1 className="text-3xl font-bold text-green-500 text-center">
                Your video is ready!
              </h1>
            </div>

            <div className="flex items-center justify-center mb-3">
              <p className="text-center text-gray-600">
                Video successfully saved and ready to share
              </p>
            </div>

            <div className="w-full max-w-4xl flex flex-col gap-4 items-center mb-8">
              <Button
                color={isCopied ? 'success' : 'primary'}
                size="lg"
                onPress={handleCopyLink}
                className={`w-full md:w-2/3 lg:w-1/2 relative overflow-hidden transition-all duration-300 ${
                  copyAnimation ? 'copy-animation' : ''
                }`}
                startContent={
                  isCopied ? (
                    <CheckCircleIcon
                      className={`w-5 h-5 ${copyAnimation ? 'animate-check' : ''}`}
                    />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  )
                }
              >
                <span
                  className={`transition-all duration-300 ${isCopied ? 'translate-x-1' : ''}`}
                >
                  {isCopied ? 'Link Copied!' : 'Copy Video Link'}
                </span>
              </Button>
            </div>
          </>
        ) : null}

        <style jsx global>{`
          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 0.7;
            }
            100% {
              transform: scale(4);
              opacity: 0;
            }
          }

          @keyframes check {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          .copy-animation::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: ripple 0.8s ease-out;
          }

          .animate-check {
            animation: check 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)
              forwards;
          }
        `}</style>
      </div>
    </main>
  );
}
