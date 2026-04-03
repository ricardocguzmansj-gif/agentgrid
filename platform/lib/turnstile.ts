import { sanitizeEnv } from './env';

export async function verifyTurnstile(token?: string | null, remoteip?: string | null) {
  const secret = sanitizeEnv(process.env.TURNSTILE_SECRET_KEY);
  
  if (!secret) {
    return { success: true, reason: 'turnstile-disabled' };
  }

  if (!token) {
    return { success: false, reason: 'missing-token' };
  }

  const body = new URLSearchParams({
    secret: secret,
    response: token,
  });

  if (remoteip) {
    body.set('remoteip', remoteip);
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });

  const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
  return { success: !!data.success, reason: data['error-codes']?.join(',') };
}
