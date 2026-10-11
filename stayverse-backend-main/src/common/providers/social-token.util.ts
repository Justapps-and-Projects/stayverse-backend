import { UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { createPublicKey, createVerify } from 'crypto';

export type SocialProvider = 'google' | 'apple';

export type SocialIdentity = {
  email: string;
  givenName: string;
  familyName: string;
};

/** Public OAuth client IDs already shipped in the mobile apps. */
const GOOGLE_AUDIENCES = new Set([
  '576811326554-1b6ki3t03p7sdcl56gjbtgrcqips7sl7.apps.googleusercontent.com',
  '576811326554-t11hkabu4d5oog1vf8ce8renubj219qn.apps.googleusercontent.com',
  '576811326554-35i5lue66cvf3resib27b8ll15ejfg4o.apps.googleusercontent.com',
]);

const APPLE_AUDIENCES = new Set([
  'com.stayverse.app',
  'com.stayverse.agent.app',
]);

function decodePart(part: string): Record<string, unknown> {
  const json = Buffer.from(part, 'base64url').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
}

export async function verifySocialIdentity(
  provider: SocialProvider,
  idToken: string,
): Promise<SocialIdentity> {
  if (provider === 'google') return verifyGoogle(idToken);
  return verifyApple(idToken);
}

async function verifyGoogle(idToken: string): Promise<SocialIdentity> {
  const { data } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
    params: { id_token: idToken },
    timeout: 12_000,
  });

  const audience = String(data?.aud ?? '');
  const email = String(data?.email ?? '').trim().toLowerCase();
  const verified = data?.email_verified === true || data?.email_verified === 'true';

  if (!GOOGLE_AUDIENCES.has(audience) || !email || !verified) {
    throw new UnauthorizedException('Google authentication failed');
  }

  return {
    email,
    givenName: String(data?.given_name ?? '').trim(),
    familyName: String(data?.family_name ?? '').trim(),
  };
}

async function verifyApple(idToken: string): Promise<SocialIdentity> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedException('Apple authentication failed');
  }

  const header = decodePart(parts[0]);
  const payload = decodePart(parts[1]);
  const kid = String(header.kid ?? '');
  const { data } = await axios.get('https://appleid.apple.com/auth/keys', {
    timeout: 12_000,
  });
  const jwk = (data?.keys ?? []).find((key: { kid?: string }) => key.kid === kid);
  if (!jwk) throw new UnauthorizedException('Apple authentication failed');

  const key = createPublicKey({ key: jwk, format: 'jwk' });
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2], 'base64url');
  if (!verifier.verify(key, signature)) {
    throw new UnauthorizedException('Apple authentication failed');
  }

  const audience = String(payload.aud ?? '');
  const issuer = String(payload.iss ?? '');
  const exp = Number(payload.exp ?? 0);
  const email = String(payload.email ?? '').trim().toLowerCase();

  if (
    issuer !== 'https://appleid.apple.com' ||
    !APPLE_AUDIENCES.has(audience) ||
    !email ||
    exp * 1000 < Date.now()
  ) {
    throw new UnauthorizedException('Apple authentication failed');
  }

  return { email, givenName: '', familyName: '' };
}
