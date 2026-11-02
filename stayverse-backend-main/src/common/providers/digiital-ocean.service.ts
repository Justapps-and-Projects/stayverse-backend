import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DOUploadService implements OnModuleInit {
  private readonly logger = new Logger(DOUploadService.name);
  private storageCheck: { provider: string; status: string; stage?: string; checkedAt?: string } = { provider: 'digitalocean', status: 'not_checked' };
  private s3: S3;
  private bucketName: string;
  private region: string;
  private cdnUrl: string;
  private readonly useSupabase: boolean;

  constructor(private readonly configService: ConfigService) {
    const provider = this.configService.get<string>('storage.provider') || 'digitalocean';
    if (!['digitalocean', 'supabase'].includes(provider)) {
      throw new Error('Unsupported STORAGE_PROVIDER');
    }
    this.useSupabase = provider === 'supabase';
    this.storageCheck = { provider, status: this.useSupabase ? 'pending' : 'not_enabled' };
    if (this.useSupabase) {
      const required = (key: string) => {
        const value = this.configService.get<string>(`storage.${key}`)?.trim();
        if (!value) throw new Error(`Supabase storage configuration missing: ${key}`);
        return value;
      };
      const projectUrl = new URL(required('supabaseUrl'));
      const endpoint = new URL(required('s3Endpoint'));
      if ([projectUrl, endpoint].some(url => url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)) {
        throw new Error('Supabase storage URLs must use HTTPS without embedded credentials or queries');
      }
      this.bucketName = required('bucket');
      this.region = required('region');
      this.cdnUrl = `${projectUrl.origin}/storage/v1/object/public/${encodeURIComponent(this.bucketName)}`;
      this.s3 = new S3({
        endpoint: endpoint.toString().replace(/\/$/, ''),
        region: this.region,
        accessKeyId: required('accessKeyId'),
        secretAccessKey: required('secretAccessKey'),
        signatureVersion: 'v4',
        s3ForcePathStyle: true,
      });
    } else {
      this.region = this.configService.get<string>('do.region');
      this.bucketName = this.configService.get<string>('do.bucket');
      this.cdnUrl = this.configService.get<string>('do.cdnUrl');
      this.s3 = new S3({
        endpoint: `https://${this.region}.digitaloceanspaces.com`,
        region: this.region,
        accessKeyId: this.configService.get<string>('do.accessKey'),
        secretAccessKey: this.configService.get<string>('do.secretKey'),
        signatureVersion: 'v4',
      });
    }
  }

  getStorageCheck() {
    return { ...this.storageCheck };
  }

  async onModuleInit() {
    if (!this.useSupabase) return;
    const key = `health-checks/${uuidv4()}.png`;
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHHsAAAAASUVORK5CYII=', 'base64');
    let stage = 'upload';
    let failure: string | undefined;
    // Run once per process start. The public health endpoint only reports the cached result.
    const bounded = async (request: any) => {
      const timer = setTimeout(() => request.abort(), 20000);
      try { return await request.promise(); } finally { clearTimeout(timer); }
    };
    try {
      await bounded(this.s3.putObject({ Bucket: this.bucketName, Key: key, Body: image, ContentType: 'image/png' }));
      stage = 'public_read';
      const response = await axios.get(`${this.cdnUrl}/${key}`, {
        responseType: 'arraybuffer', timeout: 15000, maxRedirects: 0, maxContentLength: 1024 * 1024,
      });
      if (!Buffer.from(response.data).equals(image)) throw new Error('Storage read mismatch');
    } catch {
      failure = stage;
    } finally {
      // Delete only this process's generated test object, even after an uncertain upload result.
      try { await bounded(this.s3.deleteObject({ Bucket: this.bucketName, Key: key })); }
      catch { failure = failure || 'cleanup'; }
    }
    this.storageCheck = { provider: 'supabase', status: failure ? 'failed' : 'ok', stage: failure || 'complete', checkedAt: new Date().toISOString() };
    if (failure) this.logger.warn(`Supabase storage check failed at ${failure}; see /health/storage`);
    else this.logger.log('Supabase storage upload, public read and cleanup verified');
  }

  async uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
    if (!files || files.length === 0) return [];

    const uploads = files.map((file) => this.uploadToStorage(file, folder));
    return Promise.all(uploads);
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) throw new Error('No file provided');
    return this.uploadToStorage(file, folder);
  }

  private async uploadToStorage(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `stayVerse/${folder}/${uuidv4()}-${file.originalname}`;

    await this.s3
      .upload({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ...(this.useSupabase ? {} : { ACL: 'public-read' }),
        ContentType: file.mimetype,
      })
      .promise();

    const publicPath = this.useSupabase ? fileName.split('/').map(encodeURIComponent).join('/') : fileName;
    return `${this.cdnUrl.replace(/\/$/, '')}/${publicPath}`;
  }

  async generateResumableUploadUrls(requests: { fileName: string; contentType: string }[]) {
    if (!Array.isArray(requests) || requests.length === 0) {
      throw new BadRequestException('At least one fileName and contentType pair is required');
    }

    return Promise.all(
      requests.map(async ({ fileName, contentType }) => {
        if (!fileName || !contentType) {
          throw new BadRequestException('fileName and contentType are required');
        }

        const key = `attachments/${fileName}`;

        const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType,
          ...(this.useSupabase ? {} : { ACL: 'public-read' }),
          Expires: 3600, // 1 hour
        });

        return uploadUrl;
      }),
    );
  }
}
