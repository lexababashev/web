'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { Progress } from '@heroui/progress';
import { Divider } from '@heroui/divider';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Header } from '@/components/ui/Header';
import React from 'react';
import { useUpload } from '@/src/hooks/useUpload';

interface CompiledPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default function CompiledPage({ params }: CompiledPageProps) {
  // Unwrap params
  const resolvedParams = React.use(params);
  const { eventId } = resolvedParams;

  const { useGetCompiledUpload } = useUpload();
  const {
    data: compiledUploads,
    isLoading: isLoadingData,
    error: fetchError,
  } = useGetCompiledUpload(eventId);

  const [eventDetails, setEventDetails] = useState<{
    title: string;
    description: string | null;
    creatorName: string;
    videoUrl: string | null;
  }>({
    title: 'Loading greeting...',
    description: null,
    creatorName: '',
    videoUrl: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Update event details when data is loaded
  useEffect(() => {
    if (!isLoadingData && compiledUploads && compiledUploads.length > 0) {
      // Get the first compiled video from the list
      const compiledVideo = compiledUploads[0];

      setEventDetails({
        title: 'Video Greetings',
        description: 'A compilation of warm wishes from friends and family!',
        creatorName: 'Video Compilation',
        videoUrl: null,
      });

      // Fetch video from S3 path and create a blob URL
      const fetchVideo = async () => {
        try {
          const response = await fetch(compiledVideo.uploadPath);
          if (!response.ok) {
            throw new Error('Failed to fetch video');
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          setEventDetails((prev) => ({
            ...prev,
            videoUrl: blobUrl,
          }));

          setLoadingProgress(100);
          setIsLoading(false);
        } catch (err) {
          setError('Failed to load the video. Please try again later.');
          setIsLoading(false);
        }
      };

      fetchVideo();
    } else if (
      !isLoadingData &&
      (!compiledUploads || compiledUploads.length === 0)
    ) {
      setError('No compiled video found for this event.');
      setIsLoading(false);
    }
  }, [isLoadingData, compiledUploads]);

  // Cleanup function to revoke the blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (eventDetails.videoUrl) {
        URL.revokeObjectURL(eventDetails.videoUrl);
      }
    };
  }, [eventDetails.videoUrl]);

  // Handle fetch error
  useEffect(() => {
    if (fetchError) {
      setError('Failed to load the video. Please try again later.');
      setIsLoading(false);
    }
  }, [fetchError]);

  useEffect(() => {
    if (isLoading) {
      const loadingInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(loadingInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(loadingInterval);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 p-4 pt-24">
          <Card className="max-w-md w-full shadow-md">
            <CardHeader className="flex justify-center">
              <h1 className="text-2xl font-bold">{eventDetails.title}</h1>
            </CardHeader>
            <Divider />
            <CardBody className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 mb-4">
                Loading your video greeting...
              </p>
              <Progress
                value={loadingProgress}
                color="primary"
                className="w-full mb-2"
                aria-label="Loading progress"
              />
              <p className="text-xs text-gray-500 text-right w-full">
                {loadingProgress}%
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 p-4 pt-24">
          <Card className="max-w-md w-full shadow-md">
            <CardHeader className="flex gap-3 justify-center">
              <ExclamationCircleIcon className="w-10 h-10 text-red-500" />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-red-500">Error</h1>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="text-center">
              <p>{error}</p>
            </CardBody>
            <CardFooter className="justify-center">
              <Button color="primary" onPress={() => window.location.reload()}>
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        <Card className="shadow-lg overflow-hidden bg-blue-800 border-blue-900 border-2">
          <CardHeader className="bg-blue-900 text-white p-6">
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-bold text-center">
                {eventDetails.title}
              </h1>
              <p className="text-blue-200 mt-2 text-center">
                From {eventDetails.creatorName}
              </p>
            </div>
          </CardHeader>

          <CardBody className="p-0 flex flex-col items-center bg-gradient-to-b from-blue-800 to-blue-700">
            {/* Centered Video Player with default controls */}
            <div className="relative bg-black aspect-video w-full max-w-3xl mx-auto my-8 rounded-lg overflow-hidden shadow-xl">
              {eventDetails.videoUrl ? (
                <video
                  ref={videoRef}
                  src={eventDetails.videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-white">Video not available</p>
                </div>
              )}
            </div>

            {/* Enhanced Animated Like Button */}
            <div className="flex justify-center items-center py-8 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 w-full">
              <button
                onClick={() => {
                  const likeBtn = document.querySelector('.like-btn');
                  likeBtn?.classList.toggle('liked');
                }}
                className="like-btn group relative flex items-center justify-center bg-white hover:bg-blue-50 py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 like-btn-bg transition-opacity duration-300"></div>
                <span className="heart-icon relative z-10 flex items-center justify-center mr-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-gray-400 like-heart transition-all duration-500 ease-elastic"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                  <div className="like-particles absolute">
                    <div className="circle-burst"></div>
                    <div className="particles">
                      <div className="particle top-left"></div>
                      <div className="particle top"></div>
                      <div className="particle top-right"></div>
                      <div className="particle right"></div>
                      <div className="particle bottom-right"></div>
                      <div className="particle bottom"></div>
                      <div className="particle bottom-left"></div>
                      <div className="particle left"></div>
                    </div>
                  </div>
                </span>
                <span className="like-text relative z-10 text-lg font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                  Like this video
                </span>
              </button>
            </div>

            <style jsx>{`
              .like-btn.liked .like-heart {
                color: #60a5fa;
                transform: scale(1.1);
              }

              .like-btn.liked .like-text {
                color: #3b82f6;
              }

              .like-btn.liked .like-btn-bg {
                opacity: 0.1;
              }

              .ease-elastic {
                transition-timing-function: cubic-bezier(0.68, -0.6, 0.32, 1.6);
              }

              .like-btn:active .like-heart {
                transform: scale(0.8);
              }

              .like-particles {
                display: none;
              }

              .like-btn.liked .like-particles {
                display: block;
              }

              .circle-burst {
                position: absolute;
                width: 40px;
                height: 40px;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                background-color: rgba(59, 130, 246, 0.2);
                border-radius: 50%;
                z-index: -1;
                animation: circle-burst 0.6s ease-out;
              }

              .particles div {
                position: absolute;
                width: 4px;
                height: 4px;
                top: 50%;
                left: 50%;
                border-radius: 50%;
                background-color: #3b82f6;
                transform: translate(-50%, -50%);
                animation: particle-fly 0.8s ease-out forwards;
                opacity: 0;
              }

              .particle.top-left {
                transform: rotate(-135deg) translateX(0);
              }
              .particle.top {
                transform: rotate(-90deg) translateX(0);
              }
              .particle.top-right {
                transform: rotate(-45deg) translateX(0);
              }
              .particle.right {
                transform: rotate(0deg) translateX(0);
              }
              .particle.bottom-right {
                transform: rotate(45deg) translateX(0);
              }
              .particle.bottom {
                transform: rotate(90deg) translateX(0);
              }
              .particle.bottom-left {
                transform: rotate(135deg) translateX(0);
              }
              .particle.left {
                transform: rotate(180deg) translateX(0);
              }

              @keyframes circle-burst {
                0% {
                  transform: translate(-50%, -50%) scale(0);
                  opacity: 0.5;
                }
                100% {
                  transform: translate(-50%, -50%) scale(2);
                  opacity: 0;
                }
              }

              @keyframes particle-fly {
                0% {
                  transform: rotate(var(--angle)) translateX(0);
                  opacity: 1;
                }
                100% {
                  transform: rotate(var(--angle)) translateX(12px);
                  opacity: 0;
                }
              }

              .like-btn.liked .particle.top-left {
                --angle: -135deg;
                animation-delay: 0s;
              }
              .like-btn.liked .particle.top {
                --angle: -90deg;
                animation-delay: 0.05s;
              }
              .like-btn.liked .particle.top-right {
                --angle: -45deg;
                animation-delay: 0.1s;
              }
              .like-btn.liked .particle.right {
                --angle: 0deg;
                animation-delay: 0.15s;
              }
              .like-btn.liked .particle.bottom-right {
                --angle: 45deg;
                animation-delay: 0.2s;
              }
              .like-btn.liked .particle.bottom {
                --angle: 90deg;
                animation-delay: 0.25s;
              }
              .like-btn.liked .particle.bottom-left {
                --angle: 135deg;
                animation-delay: 0.3s;
              }
              .like-btn.liked .particle.left {
                --angle: 180deg;
                animation-delay: 0.35s;
              }
            `}</style>
          </CardBody>

          <CardFooter className="flex justify-center items-center p-4 bg-blue-900 text-white">
            <p className="text-sm text-blue-200">Created with ❤️</p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
