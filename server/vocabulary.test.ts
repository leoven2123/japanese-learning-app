import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("vocabulary API", () => {
  it("should list N5 vocabulary", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vocabulary.list({ jlptLevel: "N5" });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("expression");
      expect(result[0]).toHaveProperty("reading");
      expect(result[0]).toHaveProperty("meaning");
      expect(result[0].jlptLevel).toBe("N5");
    }
  });

  it("should search vocabulary", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.vocabulary.list({ search: "こんにちは" });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("scene API", () => {
  it("should list all scenes", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scene.list();

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("description");
    }
  });
});
