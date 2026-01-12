import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/trpc";
import type { Request, Response } from "express";

// Mock context helper
function createMockContext(overrides?: Partial<Context>): Context {
  const mockReq = {
    headers: {},
    cookies: {},
  } as unknown as Request;

  const mockRes = {
    cookie: () => mockRes,
    clearCookie: () => mockRes,
  } as unknown as Response;

  return {
    req: mockReq,
    res: mockRes,
    user: null,
    ...overrides,
  };
}

describe("Auth - Password Authentication", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "test123456";
  const testName = "Test User";

  describe("Register", () => {
    it("should register a new user successfully", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.register({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.name).toBe(testName);
      expect(result.user.role).toBe("user");
    });

    it("should fail to register with duplicate email", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.register({
          email: testEmail,
          password: testPassword,
        })
      ).rejects.toThrow("该邮箱已被注册");
    });

    it("should fail to register with short password", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.register({
          email: `new-${Date.now()}@example.com`,
          password: "123", // 少于6位
        })
      ).rejects.toThrow();
    });

    it("should fail to register with invalid email", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.register({
          email: "invalid-email", // 无效邮箱格式
          password: testPassword,
        })
      ).rejects.toThrow();
    });
  });

  describe("Login", () => {
    it("should login successfully with correct credentials", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.login({
        email: testEmail,
        password: testPassword,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
    });

    it("should fail to login with wrong password", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.login({
          email: testEmail,
          password: "wrongpassword",
        })
      ).rejects.toThrow("邮箱或密码错误");
    });

    it("should fail to login with non-existent email", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.auth.login({
          email: "nonexistent@example.com",
          password: testPassword,
        })
      ).rejects.toThrow("邮箱或密码错误");
    });
  });

  describe("Logout", () => {
    it("should logout successfully", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
    });
  });

  describe("Me", () => {
    it("should return null when not authenticated", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toBeNull();
    });

    it("should return user info when authenticated", async () => {
      const mockUser = {
        id: 1,
        email: testEmail,
        name: testName,
        role: "user" as const,
        openId: null,
        password: null,
        loginMethod: "password",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext({ user: mockUser });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();

      expect(result).toEqual(mockUser);
    });
  });
});
