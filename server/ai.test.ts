import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("AI Assistant", () => {
  // AI调用需要较长时间,设置10秒超时
  it("should chat with AI", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.chat({ message: "你好" });

    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });

  it("should get study advice", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.getStudyAdvice();

    expect(result).toHaveProperty("advice");
    expect(typeof result.advice).toBe("string");
  });

  it("should explain grammar", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.ai.explainGrammar({
      grammarPoint: "は",
    });

    expect(result).toHaveProperty("explanation");
    expect(typeof result.explanation).toBe("string");
  });
});

describe("Learning Resources", () => {
  it("should list active resources", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resources.list({});

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("url");
      expect(result[0]).toHaveProperty("type");
    }
  });
});

describe("Learning Curriculum", () => {
  it("should get curriculum by level", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.curriculum.getByLevel({ level: "N5" });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("level");
      expect(result[0].level).toBe("N5");
    }
  });

  it("should get user learning path", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.curriculum.getUserPath();

    expect(result).toBeTruthy();
    expect(result).toHaveProperty("userId");
    expect(result?.userId).toBe(1);
  });
});
