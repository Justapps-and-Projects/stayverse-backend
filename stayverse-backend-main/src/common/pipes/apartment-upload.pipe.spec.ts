import { probeApartmentVideo } from './apartment-upload.pipe';
import { execFile } from 'node:child_process';
jest.mock('node:child_process', () => ({ execFile: jest.fn() }));
const probe = execFile as unknown as jest.Mock;
const file = { mimetype: 'video/mp4', size: 10, buffer: Buffer.from('video') } as Express.Multer.File;
function metadata(duration: string, video = true) {
  probe.mockImplementation((_binary, _args, _options, callback) => callback(null, { stdout: JSON.stringify({ format: { duration }, streams: [{ codec_type: video ? 'video' : 'audio' }] }), stderr: '' }));
}
describe('apartment video validation', () => {
  it('accepts exactly 42 seconds', async () => { metadata('42'); expect(await probeApartmentVideo(file)).toBe(42); });
  it.each(['42.01', '0', 'NaN'])('rejects duration %s', async (duration) => { metadata(duration); await expect(probeApartmentVideo(file)).rejects.toThrow('42 seconds'); });
  it('rejects audio disguised as video', async () => { metadata('10', false); await expect(probeApartmentVideo(file)).rejects.toThrow('valid video'); });
  it('rejects unsupported types and oversized files', async () => {
    await expect(probeApartmentVideo({ ...file, mimetype: 'image/png' })).rejects.toThrow('MP4 or MOV');
    await expect(probeApartmentVideo({ ...file, size: 51 * 1024 * 1024 })).rejects.toThrow('50 MB');
  });
  it('rejects unparseable media', async () => { probe.mockImplementation((_b, _a, _o, cb) => cb(new Error('invalid data'))); await expect(probeApartmentVideo(file)).rejects.toThrow('valid video'); });
});
