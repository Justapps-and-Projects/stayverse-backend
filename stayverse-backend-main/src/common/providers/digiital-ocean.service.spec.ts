import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { DOUploadService } from './digiital-ocean.service';
const upload = jest.fn((_params: any) => ({ promise: async () => ({}) }));
const sign = jest.fn(async (_operation: string, _params: any) => 'signed-upload-url');
jest.mock('aws-sdk', () => ({ S3: jest.fn().mockImplementation(() => ({ upload, getSignedUrlPromise: sign })) }));
jest.mock('uuid', () => ({ v4: () => 'unique' }));
const file = { originalname: 'test photo.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('test') } as Express.Multer.File;
function make(overrides: Record<string, string> = {}) {
 const values = { 'storage.provider':'supabase', 'storage.supabaseUrl':'https://project.supabase.co', 'storage.s3Endpoint':'https://project.storage.supabase.co/storage/v1/s3', 'storage.region':'region-from-dashboard', 'storage.bucket':'stayverse-media', 'storage.accessKeyId':'test-key', 'storage.secretAccessKey':'test-secret', 'do.region':'nyc3', 'do.bucket':'old', 'do.cdnUrl':'https://old.example', ...overrides };
 return new DOUploadService({ get: (key: string) => values[key] } as ConfigService);
}
beforeEach(()=>jest.clearAllMocks());
it('uses Supabase path-style signing and uploads without unsupported ACLs',async()=>{
 const service=make();
 expect(S3).toHaveBeenCalledWith(expect.objectContaining({ endpoint:'https://project.storage.supabase.co/storage/v1/s3',s3ForcePathStyle:true,signatureVersion:'v4' }));
 expect(await service.uploadFile(file,'apartments')).toBe('https://project.supabase.co/storage/v1/object/public/stayverse-media/stayVerse/apartments/unique-test%20photo.jpg');
 const request=upload.mock.calls[0][0];expect(request.Bucket).toBe('stayverse-media');expect(request).not.toHaveProperty('ACL');expect(request.ContentType).toBe('image/jpeg');
});
it('preserves DigitalOcean configuration and ACLs by default',async()=>{
 const service=make({'storage.provider':''});
 expect(await service.uploadFile(file,'users')).toBe('https://old.example/stayVerse/users/unique-test photo.jpg');
 expect(upload.mock.calls[0][0].ACL).toBe('public-read');
});
it('presigns Supabase attachment uploads without ACLs',async()=>{
 expect(await make().generateResumableUploadUrls([{fileName:'photo.jpg',contentType:'image/jpeg'}])).toEqual(['signed-upload-url']);
 expect(sign).toHaveBeenCalledWith('putObject',expect.objectContaining({Key:'attachments/photo.jpg',Expires:3600}));expect(sign.mock.calls[0][1]).not.toHaveProperty('ACL');
});
it('rejects missing Supabase credentials instead of falling back',()=>{
 expect(()=>make({'storage.secretAccessKey':''})).toThrow('Supabase storage configuration missing: secretAccessKey');
});
it('rejects insecure endpoints and unknown providers',()=>{
 expect(()=>make({'storage.s3Endpoint':'http://example.com'})).toThrow('HTTPS');
 expect(()=>make({'storage.provider':'unknown'})).toThrow('Unsupported STORAGE_PROVIDER');
});
it('handles empty batches without uploading and validates signed-upload input',async()=>{
 const service=make();expect(await service.uploadFiles([],'apartments')).toEqual([]);expect(upload).not.toHaveBeenCalled();await expect(service.generateResumableUploadUrls([])).rejects.toThrow('At least one');
});
