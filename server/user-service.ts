import crypto from 'crypto';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const SECRET_KEY = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7일

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + SECRET_KEY).digest('hex');
}

interface User {
  id: string;
  username: string;
  password: string;
}

interface LoginResult {
  token: string;
}

interface TokenPayload {
  id: string;
  username: string;
  exp: number;
}

const users: Map<string, User> = new Map();

function generateToken(user: User): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      username: user.username,
      exp: Date.now() + TOKEN_EXPIRATION,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifyTokenSignature(token: string): boolean {
  const [header, payload, signature] = token.split('.');
  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${payload}`)
    .digest('base64url');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

function decodePayload(payload: string): TokenPayload | null {
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

export function login(username: string, password: string): LoginResult | null {
  if (!username?.trim() || !password) {
    return null;
  }

  const user = users.get(username);
  const hashedPassword = hashPassword(password);

  if (!user || user.password !== hashedPassword) {
    return null;
  }
  return { token: generateToken(user) };
}

export function register(username: string, password: string): LoginResult | null {
  if (!username?.trim() || !password || password.length < 8) {
    return null;
  }

  if (users.has(username)) {
    return null;
  }

  const hashedPassword = hashPassword(password);
  const user: User = { id: crypto.randomUUID(), username, password: hashedPassword };
  users.set(username, user);
  return { token: generateToken(user) };
}

export function verifyToken(token: string): { id: string; username: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  if (!verifyTokenSignature(token)) {
    return null;
  }

  const payload = decodePayload(parts[1]);
  if (!payload) {
    return null;
  }

  if (payload.exp < Date.now()) {
    return null;
  }

  return { id: payload.id, username: payload.username };
}

export function getUser(username: string): { id: string; username: string } | null {
  const user = users.get(username);
  if (!user) {
    return null;
  }
  return { id: user.id, username: user.username };
}

export function clearUsers(): void {
  users.clear();
}
