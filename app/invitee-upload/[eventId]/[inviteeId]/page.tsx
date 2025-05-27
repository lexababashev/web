'use client';

import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { Header } from '@/components/ui/Header';
import { Progress } from '@heroui/progress';
import { Divider } from '@heroui/divider';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useUpload } from '@/src/hooks/useUpload';
import { AxiosError } from 'axios';

interface InviteeUploadProps {
  params: Promise<{
    eventId: string;
    inviteeId: string;
  }>;
}

export default function InviteeUploadPage({ params }: InviteeUploadProps) {
  // Unwrap params using React.use()
  const resolvedParams = React.use(params);
  const { eventId, inviteeId } = resolvedParams;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Use the hooks for API integration
  const { useGetInviteeUploads, uploadInviteeVideo } = useUpload();
  const inviteeUploadsQuery = useGetInviteeUploads(eventId, inviteeId);

  useEffect(() => {
    if (inviteeUploadsQuery.isPending) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

    if (inviteeUploadsQuery.isError) {
      setError('Failed to check existing uploads. Please try again.');
    }
  }, [inviteeUploadsQuery.isPending, inviteeUploadsQuery.isError]);

  useEffect(() => {
    if (inviteeUploadsQuery.isSuccess) {
      // If invitee has any uploads, they can't upload again
      if (inviteeUploadsQuery.data.length > 0) {
        setUploadStatus('success');
      }
    }
  }, [inviteeUploadsQuery.isSuccess, inviteeUploadsQuery.data]);

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file.');
      return;
    }

    if (file.type !== 'video/mp4') {
      setError('Please select an MP4 video file.');
      return;
    }

    const maxSizeBytes = 50 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(
        `File size exceeds 50MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
      );
      return;
    }

    // Clear previous errors
    setError(null);

    // Store the selected file
    setSelectedFile(file);

    // Create and set video preview URL
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);

    // Reset the file input value to allow selecting the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a video file to upload.');
      return;
    }

    // Check if any uploads have been added for this invitee while the page was open
    try {
      const latestUploads = await inviteeUploadsQuery.refetch();
      if (latestUploads.data && latestUploads.data.length > 0) {
        setError(
          'A video has already been uploaded for this invitation. Refresh to see the current status.'
        );
        setUploadStatus('error');
        return;
      }
    } catch (err) {}

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Start the upload
      const uploadResult = uploadInviteeVideo.mutateAsync({
        eventId,
        inviteeId,
        file: selectedFile,
      });

      // Simulate progress since we can't get real progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      // Wait for upload to complete
      await uploadResult;

      // Set final progress and status
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');

      // Refresh the uploads list
      inviteeUploadsQuery.refetch();
    } catch (err) {
      setUploadStatus('error');

      // Extract specific error message from API response if available
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Failed to upload video. Please try again.';

      setError(errorMessage);
    }
  };

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const resetUpload = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setError(null);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Checking upload availability...</p>
        </div>
      </main>
    );
  }

  if (error && uploadStatus !== 'uploading' && uploadStatus !== 'success') {
    return (
      <main className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 p-4 max-w-lg mx-auto">
          <Card className="w-full">
            <CardHeader className="flex gap-3 justify-center">
              <ExclamationCircleIcon className="w-10 h-10 text-red-500" />
              <div className="flex flex-col items-center">
                <p className="text-xl font-bold text-red-500">Upload Error</p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="text-center">
              <p className="mb-2 text-red-700 font-medium">
                The file could not be uploaded:
              </p>
              <p className="text-gray-800">{error}</p>
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

  if (uploadStatus === 'success') {
    return (
      <main className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 p-4 max-w-lg mx-auto">
          <Card className="w-full">
            <CardHeader className="flex gap-3 justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
              <div className="flex flex-col items-center">
                <p className="text-xl font-bold text-green-500">
                  Upload Successful!
                </p>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="text-center">
              <p className="mb-4 text-blue-500">
                Your video has been successfully uploaded.
              </p>
              <p className="mb-4 text-blue-500">
                Thank you for your contribution!
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-col items-center pt-20 px-4 pb-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-center mb-2">
          Upload Your Video
        </h1>
        <p className="text-gray-600 text-center mb-8">
          You've been invited to contribute a video
        </p>

        <Card className="w-full mb-6">
          <CardBody className="flex flex-col items-center p-6">
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploadStatus === 'uploading'}
            />

            {!videoPreviewUrl ? (
              <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M24 8C15.163 8 8 15.163 8 24C8 32.837 15.163 40 24 40C32.837 40 40 32.837 40 24C40 15.163 32.837 8 24 8ZM30 25.5H25.5V30C25.5 30.825 24.825 31.5 24 31.5C23.175 31.5 22.5 30.825 22.5 30V25.5H18C17.175 25.5 16.5 24.825 16.5 24C16.5 23.175 17.175 22.5 18 22.5H22.5V18C22.5 17.175 23.175 16.5 24 16.5C24.825 16.5 25.5 17.175 25.5 18V22.5H30C30.825 22.5 31.5 23.175 31.5 24C31.5 24.825 30.825 25.5 30 25.5Z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Select a video to upload
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">MP4, up to 50MB</p>
                  <div className="mt-4">
                    <Button color="primary" onPress={handleFileSelect}>
                      Select Video
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                  <video
                    src={videoPreviewUrl}
                    className="w-full h-full object-cover"
                    controls
                  />
                </div>

                {selectedFile && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                )}

                {error && uploadStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 font-medium">
                      <ExclamationCircleIcon className="inline-block w-5 h-5 mr-1 align-text-bottom" />
                      {error}
                    </p>
                  </div>
                )}

                {uploadStatus === 'uploading' ? (
                  <div className="w-full">
                    <Progress
                      value={uploadProgress}
                      color="primary"
                      className="mb-2"
                      aria-label="Upload progress"
                    />
                    <p className="text-sm text-center text-gray-600">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button
                      color="primary"
                      className="mr-2"
                      onPress={handleUpload}
                      disabled={uploadInviteeVideo.isPending}
                    >
                      Upload Video
                    </Button>
                    <Button
                      color="primary"
                      variant="light"
                      onPress={resetUpload}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="w-full max-w-2xl">
          <h2 className="text-xl font-semibold mb-3">Instructions</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Select a video from your device by clicking the "Select Video"
                button
              </li>
              <li>Review your video using the preview player</li>
              <li>Click "Upload Video" to add your contribution</li>
              <li>
                Wait for the upload to complete - do not close this page while
                uploading
              </li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
