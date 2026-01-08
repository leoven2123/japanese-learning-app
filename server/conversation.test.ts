import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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

describe("AI助手对话历史功能", () => {
  it("应该能够创建新对话并保存消息", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 发送第一条消息,应该自动创建对话
    const response = await caller.ai.chat({
      message: "你好,请介绍一下日语的は和が的区别",
    });

    expect(response).toHaveProperty("reply");
    expect(response).toHaveProperty("conversationId");
    expect(typeof response.conversationId).toBe("number");
  }, 30000);

  it("应该能够获取用户的对话列表", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const conversations = await caller.ai.getConversations();

    expect(Array.isArray(conversations)).toBe(true);
    // 至少应该有前面测试创建的对话
    expect(conversations.length).toBeGreaterThan(0);
  });

  it("应该能够在现有对话中继续对话", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 先创建一个对话
    const firstResponse = await caller.ai.chat({
      message: "什么是动词て形?",
    });

    const conversationId = firstResponse.conversationId;
    expect(conversationId).toBeDefined();

    // 在同一对话中继续
    const secondResponse = await caller.ai.chat({
      message: "请给我一些例子",
      conversationId,
    });

    expect(secondResponse.conversationId).toBe(conversationId);
    expect(secondResponse.reply).toBeTruthy();
  }, 60000);

  it("应该能够获取对话的消息历史", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建一个对话
    const response = await caller.ai.chat({
      message: "请解释一下日语的敬语",
    });

    const conversationId = response.conversationId!;

    // 获取消息历史
    const messages = await caller.ai.getConversationMessages({ conversationId });

    expect(Array.isArray(messages)).toBe(true);
    // 应该至少有用户消息和AI回复两条消息
    expect(messages.length).toBeGreaterThanOrEqual(2);
    expect(messages[0]?.role).toBe("user");
    expect(messages[1]?.role).toBe("assistant");
  }, 30000);

  it("应该能够删除对话", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建一个对话
    const response = await caller.ai.chat({
      message: "测试删除功能",
    });

    const conversationId = response.conversationId!;

    // 删除对话
    const deleteResult = await caller.ai.deleteConversation({ conversationId });

    expect(deleteResult.success).toBe(true);

    // 验证对话已被删除
    const conversations = await caller.ai.getConversations();
    const deletedConv = conversations.find(c => c.id === conversationId);
    expect(deletedConv).toBeUndefined();
  }, 30000);
});
