import { createHash, randomBytes } from 'crypto';

export function generateApiKey(): {
  plaintext: string;
  hash: string;
  prefix: string;
} {
  const plaintext = `hs_${randomBytes(24).toString('hex')}`;

  return {
    plaintext,
    hash: hashApiKey(plaintext),
    prefix: plaintext.slice(0, 12),
  };
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}
