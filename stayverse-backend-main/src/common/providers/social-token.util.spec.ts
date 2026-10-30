import axios from 'axios';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { verifySocialIdentity } from './social-token.util';
jest.mock('axios');
const get = axios.get as jest.Mock;
const agentClient = '576811326554-msfgvqpar85mk5mit7u38e6iuhq96a5c.apps.googleusercontent.com';
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const key = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key' };
function appleToken(overrides = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ aud: 'com.stayverse.agent.app', iss: 'https://appleid.apple.com', email: 'agent@example.com', email_verified: true, exp: Math.floor(Date.now() / 1000) + 60, ...overrides })).toString('base64url');
  const input = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(input).sign(privateKey).toString('base64url');
  return `${input}.${signature}`;
}
beforeEach(() => get.mockReset());
it('accepts the existing Agent iOS Google OAuth client', async () => {
  get.mockResolvedValue({ data: { aud: agentClient, email: 'Agent@example.com', email_verified: 'true' } });
  await expect(verifySocialIdentity('google', 'google-token')).resolves.toMatchObject({ email: 'agent@example.com' });
});
it('rejects unrelated Google clients and unverified email', async () => {
  get.mockResolvedValueOnce({ data: { aud: 'unrelated', email: 'agent@example.com', email_verified: true } });
  await expect(verifySocialIdentity('google', 'token')).rejects.toThrow('could not be verified');
  get.mockResolvedValueOnce({ data: { aud: agentClient, email: 'agent@example.com', email_verified: false } });
  await expect(verifySocialIdentity('google', 'token')).rejects.toThrow('could not be verified');
});
it('preserves valid Apple sign-in for the Agent bundle', async () => {
  get.mockResolvedValue({ data: { keys: [key] } });
  await expect(verifySocialIdentity('apple', appleToken())).resolves.toMatchObject({ email: 'agent@example.com' });
});
it('rejects expired and malformed Apple tokens', async () => {
  get.mockResolvedValue({ data: { keys: [key] } });
  await expect(verifySocialIdentity('apple', appleToken({ exp: 0 }))).rejects.toThrow('could not be verified');
  await expect(verifySocialIdentity('apple', 'invalid')).rejects.toThrow('could not be verified');
});
