import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { login, verifyToken, register, getUser, clearUsers } from './user-service';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
});

describe('User Service', () => {
  beforeEach(() => {
    // 각 테스트마다 상태 초기화
    clearUsers();
    initializeDefaultUsers();
  });

  describe('login()', () => {
    it('유효한 사용자명과 비밀번호로 로그인 시 JWT 토큰 반환', () => {
      const result = login('user1', 'password123');
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
    });

    it('잘못된 비밀번호로 로그인 시 null 반환', () => {
      const result = login('user1', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('존재하지 않는 사용자로 로그인 시 null 반환', () => {
      const result = login('nonexistent', 'password123');
      expect(result).toBeNull();
    });
  });

  describe('verifyToken()', () => {
    it('유효한 토큰으로 사용자 정보 반환', () => {
      const loginResult = login('user1', 'password123');
      const user = verifyToken(loginResult!.token);
      expect(user).toMatchObject({ username: 'user1' });
      expect(user?.id).toBeDefined();
    });

    it('유효하지 않은 토큰으로 null 반환', () => {
      const user = verifyToken('invalid.token.here');
      expect(user).toBeNull();
    });

    it('만료된 토큰으로 null 반환', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxIiwidXNlcm5hbWUiOiJ1c2VyMSIsImV4cCI6MH0.invalid';
      const user = verifyToken(expiredToken);
      expect(user).toBeNull();
    });
  });

  describe('register()', () => {
    it('새로운 사용자 등록 시 토큰 반환', () => {
      const result = register('newuser', 'newpass123');
      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
    });

    it('이미 존재하는 사용자명으로 등록 시 null 반환', () => {
      const result = register('user1', 'password123');
      expect(result).toBeNull();
    });
  });

  describe('getUser()', () => {
    it('유효한 사용자명으로 사용자 정보 반환', () => {
      const user = getUser('user1');
      expect(user).toMatchObject({ username: 'user1' });
      expect(user?.id).toBeDefined();
    });

    it('존재하지 않는 사용자명으로 null 반환', () => {
      const user = getUser('nonexistent');
      expect(user).toBeNull();
    });
  });
});

function initializeDefaultUsers(): void {
  register('user1', 'password123');
}
