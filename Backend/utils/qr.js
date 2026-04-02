import crypto from 'crypto';

const QR_WINDOW_SECONDS = parseInt(process.env.QR_WINDOW_SECONDS || '5', 10);
const QR_MAX_SKEW_WINDOWS = parseInt(process.env.QR_MAX_SKEW_WINDOWS || '1', 10);

const toBase64Url = (buffer) =>
  buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (value) =>
  Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const getWindow = (timestamp = Date.now()) =>
  Math.floor(timestamp / (QR_WINDOW_SECONDS * 1000));

export function generateQrToken({ employeeId, secret, timestamp = Date.now() }) {
  const window = getWindow(timestamp);
  const payload = `${employeeId}.${window}`;
  const signature = toBase64Url(
    crypto.createHmac('sha256', secret).update(payload).digest()
  );

  return `${payload}.${signature}`;
}

export function validateQrToken({ token, employeeId, secret }) {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [tokenEmployeeId, windowStr, signature] = parts;
  if (tokenEmployeeId !== employeeId) return false;

  const window = Number(windowStr);
  if (!Number.isFinite(window)) return false;

  const currentWindow = getWindow();
  if (Math.abs(currentWindow - window) > QR_MAX_SKEW_WINDOWS) {
    return false;
  }

  const payload = `${employeeId}.${window}`;
  const expectedSignature = toBase64Url(
    crypto.createHmac('sha256', secret).update(payload).digest()
  );

  const expectedBuffer = fromBase64Url(expectedSignature);
  const signatureBuffer = fromBase64Url(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function getQrWindowSeconds() {
  return QR_WINDOW_SECONDS;
}
