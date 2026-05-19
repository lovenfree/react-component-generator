import { describe, it, expect } from 'vitest';

const API_BASE = 'http://localhost:3002';

describe('Auth API Integration', () => {
  it('회원가입 후 로그인 가능', async () => {
    const username = `user_${Date.now()}`;
    const password = 'password1234';

    // 회원가입
    const registerRes = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    expect(registerRes.status).toBe(200);
    const registerData = (await registerRes.json()) as { token?: string };
    expect(registerData.token).toBeDefined();

    // 로그인
    const loginRes = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = (await loginRes.json()) as { token?: string };
    expect(loginData.token).toBeDefined();
  });

  it('잘못된 비밀번호로 로그인 실패', async () => {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nonexistent', password: 'wrong' }),
    });
    expect(res.status).toBe(401);
  });

  it('토큰으로 사용자 정보 조회 가능', async () => {
    const username = `user_${Date.now()}`;
    const password = 'password1234';

    // 회원가입
    const registerRes = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    expect(registerRes.status).toBe(200);
    const registerData = (await registerRes.json()) as { token?: string };
    const token = registerData.token;
    expect(token).toBeDefined();

    // /api/me 호출
    const meRes = await fetch(`${API_BASE}/api/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(meRes.status).toBe(200);
    const userData = (await meRes.json()) as { id?: string; username?: string };
    expect(userData.username).toBe(username);
  });

  it('유효하지 않은 토큰으로 /api/me 실패', async () => {
    const res = await fetch(`${API_BASE}/api/me`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid.token.here' },
    });
    expect(res.status).toBe(401);
  });
});
