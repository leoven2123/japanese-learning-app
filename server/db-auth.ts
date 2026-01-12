import { eq } from "drizzle-orm";
import { users, InsertUser, User } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * ============================================
 * 用户认证相关查询函数
 * ============================================
 */

/**
 * 根据邮箱查找用户
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 创建新用户（用于密码注册）
 */
export async function createUser(user: {
  email: string;
  password: string;
  name: string;
  loginMethod: string;
}): Promise<User> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const insertData: InsertUser = {
    email: user.email,
    password: user.password,
    name: user.name,
    loginMethod: user.loginMethod,
    role: "user",
    lastSignedIn: new Date(),
  };

  const result = await db.insert(users).values(insertData);
  
  // 获取刚创建的用户
  const newUser = await getUserByEmail(user.email);
  if (!newUser) {
    throw new Error("Failed to create user");
  }

  return newUser;
}

/**
 * 更新用户最后登录时间
 */
export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}
