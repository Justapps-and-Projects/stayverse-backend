import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DOUploadService {
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
