// ========================================================
// ROYAL POSTAL GUILD - SOCIAL STORY TEASER EXPORTER ENGINE
// Video Recording (WebM/MP4), High-Res PNG & Web Share API
// ========================================================

import type { StoryTeaserConfig, Particle } from './storyCanvasRenderer';
import {
  createStoryParticles,
  updateStoryParticles,
  renderStoryFrame
} from './storyCanvasRenderer';

export interface VideoExportProgress {
  status: 'idle' | 'rendering' | 'encoding' | 'completed' | 'error';
  progress: number; // 0 to 100
  message?: string;
  blob?: Blob;
  url?: string;
}

// Synthesize ambient medieval sound effects using Web Audio API
export function createAmbientAudioStream(durationSec: number): MediaStreamAudioDestinationNode | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();
    const dest = ctx.createMediaStreamDestination();

    // Subtle Soft Clock Ticking Sound every second (75% volume)
    const now = ctx.currentTime;
    for (let t = 0; t < durationSec; t += 1.0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine'; // Softer waveform
      osc.frequency.setValueAtTime(650, now + t);
      osc.frequency.exponentialRampToValueAtTime(100, now + t + 0.04);

      gain.gain.setValueAtTime(0.06, now + t);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.05);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now + t);
      osc.stop(now + t + 0.06);
    }

    // Gentle Warm Resonant Chime at the start (75% volume)
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(528, now + 0.1); // 528 Hz (Solfeggio harmonic)
    bellGain.gain.setValueAtTime(0.045, now + 0.1);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
    bellOsc.connect(bellGain);
    bellGain.connect(dest);
    bellOsc.start(now + 0.1);
    bellOsc.stop(now + 2.6);

    return dest;
  } catch (e) {
    console.warn('Web Audio API not initialized for export', e);
    return null;
  }
}

// ----------------------------------------------------
// 1. EXPORT ANIMATED STORY VIDEO (MP4 / WebM)
// ----------------------------------------------------
export async function recordStoryVideo(
  config: StoryTeaserConfig,
  qrImageElement: HTMLImageElement | null,
  durationSec: number = 5,
  fps: number = 30,
  onProgress?: (p: VideoExportProgress) => void
): Promise<{ blob: Blob; url: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.({ status: 'rendering', progress: 5, message: 'Preparing royal canvas...' });

      // Create offscreen 1080 x 1920 canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not obtain 2D canvas context');

      // Setup particles
      const particles: Particle[] = createStoryParticles(50);

      // Check supported MIME types for MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      // Capture Canvas Stream
      const canvasStream = canvas.captureStream(fps);

      // Add Audio Stream if enabled
      let audioDest: MediaStreamAudioDestinationNode | null = null;
      if (config.soundEnabled) {
        audioDest = createAmbientAudioStream(durationSec);
        if (audioDest) {
          const audioTrack = audioDest.stream.getAudioTracks()[0];
          if (audioTrack) {
            canvasStream.addTrack(audioTrack);
          }
        }
      }

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: 8000000 // 8 Mbps high quality
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        onProgress?.({ status: 'encoding', progress: 95, message: 'Finalizing royal video...' });
        const videoBlob = new Blob(chunks, { type: mimeType.split(';')[0] || 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        onProgress?.({ status: 'completed', progress: 100, message: 'Video Ready!', blob: videoBlob, url: videoUrl });
        resolve({ blob: videoBlob, url: videoUrl });
      };

      recorder.onerror = (e) => {
        onProgress?.({ status: 'error', progress: 0, message: 'Recording failed' });
        reject(e);
      };

      // Start Recorder
      recorder.start();

      const totalFrames = durationSec * fps;
      let frameCount = 0;
      const startTime = Date.now();
      const frameInterval = 1000 / fps;

      function renderNextFrame() {
        if (frameCount >= totalFrames) {
          setTimeout(() => {
            recorder.stop();
          }, 200);
          return;
        }

        const simulatedTime = startTime + frameCount * frameInterval;
        updateStoryParticles(particles, 1080, 1920);
        renderStoryFrame(ctx!, config, particles, simulatedTime, qrImageElement);

        frameCount++;
        const pct = Math.min(90, Math.floor((frameCount / totalFrames) * 90));
        onProgress?.({
          status: 'rendering',
          progress: pct,
          message: `Inscribing Story frames (${Math.floor((frameCount / totalFrames) * 100)}%)...`
        });

        requestAnimationFrame(renderNextFrame);
      }

      renderNextFrame();
    } catch (err) {
      console.error('Video recording failed:', err);
      onProgress?.({ status: 'error', progress: 0, message: (err as Error).message });
      reject(err);
    }
  });
}

// ----------------------------------------------------
// 2. EXPORT HIGH-RESOLUTION STORY SNAPSHOT (1080x1920 PNG)
// ----------------------------------------------------
export async function exportStoryImage(
  config: StoryTeaserConfig,
  qrImageElement: HTMLImageElement | null
): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not obtain canvas context');

      const particles = createStoryParticles(60);
      renderStoryFrame(ctx, config, particles, Date.now(), qrImageElement);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        },
        'image/png',
        1.0
      );
    } catch (e) {
      reject(e);
    }
  });
}

// ----------------------------------------------------
// 3. NATIVE MOBILE STORY SHARING (navigator.share)
// ----------------------------------------------------
export async function shareToSocialStory(
  file: File | Blob,
  fileName: string = 'royal_missive_story.mp4',
  title: string = 'A Royal Missive Awaits...',
  text: string = 'A sealed missive travels towards thee across the realm!'
): Promise<boolean> {
  const shareFile = file instanceof File ? file : new File([file], fileName, { type: file.type || 'video/mp4' });

  if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
    try {
      await navigator.share({
        files: [shareFile],
        title,
        text
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share failed, triggering download:', err);
      }
    }
  }

  // Fallback: Trigger direct file download
  triggerFileDownload(shareFile, fileName);
  return false;
}

// ----------------------------------------------------
// 4. DOWNLOAD TRIGGER HELPER
// ----------------------------------------------------
export function triggerFileDownload(blobOrFile: Blob | File, filename: string) {
  const url = URL.createObjectURL(blobOrFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ----------------------------------------------------
// 5. COPY IMAGE TO CLIPBOARD
// ----------------------------------------------------
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || !window.ClipboardItem) return false;
    // Clipboard item requires image/png
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (e) {
    console.warn('Clipboard copy failed:', e);
    return false;
  }
}
