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

describe("vocabulary import verification", () => {
  it("should have N3-N1 vocabulary data imported", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 测试N3词汇
    const n3Result = await caller.vocabulary.list({ jlptLevel: "N3", limit: 10, offset: 0 });
    expect(n3Result.length).toBeGreaterThan(0);

    // 测试N2词汇
    const n2Result = await caller.vocabulary.list({ jlptLevel: "N2", limit: 10, offset: 0 });
    expect(n2Result.length).toBeGreaterThan(0);

    // 测试N1词汇
    const n1Result = await caller.vocabulary.list({ jlptLevel: "N1", limit: 10, offset: 0 });
    expect(n1Result.length).toBeGreaterThan(0);
  });

  it("should have correct vocabulary structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vocabulary.list({ jlptLevel: "N3", limit: 1, offset: 0 });
    expect(result.length).toBe(1);

    const vocab = result[0];
    expect(vocab).toHaveProperty("id");
    expect(vocab).toHaveProperty("expression");
    expect(vocab).toHaveProperty("reading");
    expect(vocab).toHaveProperty("meaning");
    expect(vocab).toHaveProperty("jlptLevel");
    expect(vocab?.jlptLevel).toBe("N3");
  });

  it("should support vocabulary search", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vocabulary.list({ search: "作", limit: 10, offset: 0 });
    expect(result.length).toBeGreaterThan(0);
  });
});
