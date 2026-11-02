import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { DOUploadService } from './digiital-ocean.service';
const upload = jest.fn((_params: any) => ({ promise: async () => ({}) }));
const put = jest.fn();
const remove = jest.fn();
jest.mock('axios');
const sign = jest.fn(async (_operation: string, _params: any) => 'signed-upload-url');
jest.mock('aws-sdk', () => ({ S3: jest.fn().mockImplementation(() => ({ upload, getSignedUrlPromise: sign, putObject: put, deleteObject: remove })) }));
jest.mock('uuid', () => ({ v4: () => 'unique' }));
const file = { originalname: 'test photo.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('test') } as Express.Multer.File;
function make(overrides: Record<string, string> = {}) {
 const values = { 'storage.provider':'supabase', 'storage.supabaseUrl':'https://project.supabase.co', 'storage.s3Endpoint':'https://project.storage.supabase.co/storage/v1/s3', 'storage.region':'region-from-dashboard', 'storage.bucket':'stayverse-media', 'storage.accessKeyId':'test-key', 'storage.secretAccessKey':'test-secret', 'do.region':'nyc3', 'do.bucket':'old', 'do.cdnUrl':'https://old.example', ...overrides };
 return new DOUploadService({ get: (key: string) => values[key] } as ConfigService);
}
beforeEach(()=>{
 jest.clearAllMocks();
 put.mockImplementation(() => ({ promise: async () => ({}), abort: jest.fn() }));
 remove.mockImplementation(() => ({ promise: async () => ({}), abort: jest.fn() }));
});
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

it('verifies a real upload/read/cleanup sequence once and reports only cached status', async () => {
 const service=make();
 (axios.get as jest.Mock).mockImplementation(async () => ({data:put.mock.calls[0][0].Body}));
 await service.onModuleInit();
 expect(service.getStorageCheck()).toMatchObject({provider:'supabase',status:'ok',stage:'complete'});
 expect(put.mock.calls[0][0]).toMatchObject({Bucket:'stayverse-media',Key:'health-checks/unique.png',ContentType:'image/png'});
 expect(remove).toHaveBeenCalledWith({Bucket:'stayverse-media',Key:'health-checks/unique.png'});
 service.getStorageCheck();service.getStorageCheck();expect(put).toHaveBeenCalledTimes(1);
});
it('reports upload failure without secrets and still attempts test-object cleanup',async()=>{
 put.mockImplementation(()=>({promise:async()=>{throw new Error('secret failure')},abort:jest.fn()}));
 const service=make();await service.onModuleInit();
 expect(service.getStorageCheck()).toMatchObject({status:'failed',stage:'upload'});
 expect(JSON.stringify(service.getStorageCheck())).not.toContain('secret failure');expect(remove).toHaveBeenCalled();
});
it('reports a public read mismatch and cleans up',async()=>{
 (axios.get as jest.Mock).mockResolvedValue({data:Buffer.from('wrong data')});
 const service=make();await service.onModuleInit();expect(service.getStorageCheck()).toMatchObject({status:'failed',stage:'public_read'});expect(remove).toHaveBeenCalled();
});
it('reports cleanup failures rather than claiming a completed check',async()=>{
 (axios.get as jest.Mock).mockImplementation(async()=>({data:put.mock.calls[0][0].Body}));
 remove.mockImplementation(()=>({promise:async()=>{throw new Error('cleanup failed')},abort:jest.fn()}));
 const service=make();await service.onModuleInit();expect(service.getStorageCheck()).toMatchObject({status:'failed',stage:'cleanup'});
});
it('does not probe DigitalOcean or modify existing objects',async()=>{
 const service=make({'storage.provider':'digitalocean'});await service.onModuleInit();expect(service.getStorageCheck()).toMatchObject({provider:'digitalocean',status:'not_enabled'});expect(put).not.toHaveBeenCalled();expect(remove).not.toHaveBeenCalled();
});
