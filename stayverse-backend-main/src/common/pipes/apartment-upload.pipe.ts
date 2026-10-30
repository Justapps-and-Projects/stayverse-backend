import { BadRequestException, PipeTransform } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { FileUploadPipe } from './file-upload.pipe';

const run = promisify(execFile);
export const MAX_APARTMENT_VIDEO_BYTES = 50 * 1024 * 1024;
export async function probeApartmentVideo(file: Express.Multer.File): Promise<number> {
  if (!['video/mp4', 'video/quicktime'].includes(file.mimetype) || file.size > MAX_APARTMENT_VIDEO_BYTES) {
    throw new BadRequestException('Use one MP4 or MOV video no larger than 50 MB.');
  }
  const directory = await mkdtemp(join(tmpdir(), 'stayverse-video-'));
  try {
    const filename = join(directory, 'upload');
    await writeFile(filename, file.buffer);
    const { path: binary } = require('ffprobe-static');
    const { stdout } = await run(binary, ['-v', 'error', '-protocol_whitelist', 'file', '-show_entries', 'format=duration:stream=codec_type,duration', '-of', 'json', filename], { timeout: 15000, maxBuffer: 1024 * 1024 });
    const metadata = JSON.parse(stdout);
    const duration = Number(metadata.format?.duration);
    if (!metadata.streams?.some((stream: { codec_type: string }) => stream.codec_type === 'video') || !Number.isFinite(duration) || duration <= 0 || duration > 42) {
      throw new Error('Invalid video duration');
    }
    return duration;
  } catch {
    throw new BadRequestException('Upload a valid video lasting no more than 42 seconds.');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export class ApartmentUploadPipe implements PipeTransform {
  async transform(files: Record<string, Express.Multer.File[]>) {
    const images = files?.apartmentImages || [];
    const videos = files?.apartmentVideo || [];
    if (images.length < 2 || images.length > 12 || videos.length > 1) {
      throw new BadRequestException('Upload 2–12 photos and at most one apartment video.');
    }
    await new FileUploadPipe().transform({ apartmentImages: images });
    const videoDurationSeconds = videos[0] ? await probeApartmentVideo(videos[0]) : undefined;
    return { ...files, videoDurationSeconds };
  }
}
