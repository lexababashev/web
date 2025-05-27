import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { VideoItem } from '../../app/(auth)/video-editor/_components/types';

// Instead of initializing at the module level, create a function to get the FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

// Function to safely get an FFmpeg instance only in browser environments
function getFFmpeg(): FFmpeg {
  if (ffmpegInstance) return ffmpegInstance;

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    ffmpegInstance = new FFmpeg();
    return ffmpegInstance;
  }

  // This will never be reached during SSR because we check for window
  throw new Error('FFmpeg can only be used in browser environment');
}

export const ffmpegService = {
  async load() {
    if (isLoaded) return;

    const ffmpeg = getFFmpeg();

    // Use the absolute URL path with origin to ensure proper resolution
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
    });

    isLoaded = true;
  },

  async cleanupVFS() {
    if (!ffmpegInstance) return;

    try {
      const files = await ffmpegInstance.listDir('/');
      for (const file of files) {
        if (!file.isDir) {
          await ffmpegInstance.deleteFile(file.name);
        }
      }
    } catch (error) {
      console.error('Clearing error:', error);
    }
  },

  async compileVideo(
    videos: VideoItem[],
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.load();
    const ffmpeg = getFFmpeg();

    try {
      ffmpeg.on('log', ({ message }) => {
        console.log(message);
      });

      ffmpeg.on('progress', ({ progress }) => {
        const progressPercent = Math.round(progress * 100);
        console.log(`Progress: ${progressPercent}%`);
        if (onProgress) {
          onProgress(progressPercent);
        }
      });

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const inputName = `input${i}.mp4`;
        const tempName = `temp${i}.mp4`;
        const start = video.trimStart ?? 0;
        const end = video.trimEnd ?? video.duration ?? 0;

        await ffmpeg.writeFile(inputName, await fetchFile(video.file));

        const trimArgs = [];
        if (video.trimStart !== undefined || video.trimEnd !== undefined) {
          trimArgs.push('-ss', `${start}`, '-to', `${end}`);
        }

        // 360p transcoding
        await ffmpeg.exec([
          '-i',
          inputName,
          ...trimArgs,
          '-vf',
          'scale=640:360,fps=20',
          '-c:v',
          'libx264',
          '-crf',
          '40',
          '-preset',
          'ultrafast',
          '-movflags',
          '+faststart',
          '-profile:v',
          'baseline',
          '-c:a',
          'aac',
          '-b:a',
          '64k',
          '-x264-params',
          'ref=1:me=dia',
          tempName,
        ]);

        // 1080p transcoding
        // await ffmpeg.exec([
        //   '-i',
        //   inputName,
        //   ...trimArgs,
        //   '-vf', 'scale=1920:1080,fps=21',
        //   '-c:v','libx264',
        //   '-crf', '32',
        //   '-preset', 'ultrafast',
        //   '-profile:v', 'main',
        //   '-movflags', '+faststart',
        //   '-c:a', 'aac',
        //   '-b:a', '64k',
        //   '-x264-params', 'ref=1:me=dia',
        //   tempName,
        // ]);
      }

      let concatFileContent = '';
      for (let i = 0; i < videos.length; i++) {
        concatFileContent += `file temp${i}.mp4\n`;
      }
      await ffmpeg.writeFile('concat_list.txt', concatFileContent);

      const outputName = 'output.mp4';
      await ffmpeg.exec([
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        'concat_list.txt',
        '-c',
        'copy',
        outputName,
      ]);

      if (onProgress) {
        onProgress(100);
      }

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: 'video/mp4' });

      await this.cleanupVFS();

      return blob;
    } catch (error) {
      await this.cleanupVFS();
      throw error;
    }
  },
};
