import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
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

describe("网络热词功能", () => {
  it("应该能够获取热词更新状态", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.slang.getUpdateStatus();
    
    expect(status).toBeDefined();
    expect(status).toHaveProperty("totalSlangCount");
    expect(status).toHaveProperty("lastUpdateTime");
    expect(typeof status.totalSlangCount).toBe("number");
  });

  it("应该能够手动触发热词更新", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.slang.updateSlangWords();
    
    expect(result).toBeDefined();
    expect(result).toHaveProperty("success");
    expect(typeof result.success).toBe("boolean");
    
    if (result.success) {
      expect(result).toHaveProperty("addedCount");
      expect(result).toHaveProperty("updatedCount");
      expect(typeof result.addedCount).toBe("number");
      expect(typeof result.updatedCount).toBe("number");
    }
  }, 60000); // 60秒超时,因为需要调用LLM和搜索API
});
