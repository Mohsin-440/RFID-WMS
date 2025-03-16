import { randomBytes } from 'crypto';

export function generateUltraUniqueString() {
  const randomPart = randomBytes(64).toString('hex'); // 16 characters
  const timestampPart = Date.now().toString(36); // Convert timestamp to base-36
  return `${randomPart}-${timestampPart}`;
}

