import { randomUUID } from "crypto";
import { connectMongo, getCollections } from "../database/mongo";
import { User, UserWallet, Transaction, Investment } from "@shared/api";
import { supabase, isSupabaseEnabled } from "../lib/supabase";

let initialized = false;
let useMemory = false;
let useSupabase = false;

// In-memory fallback stores (dev-only)
const memory = {
  users: [] as Array<any>,
  wallets: new Map<string, any>(),
  sessions: new Map<string, { token: string; userId: string; createdAt: string }>(),
};

async function init() {
  if (initialized) return;
  if (isSupabaseEnabled && supabase) {
    try {
      const probe = await supabase.from("users").select("id", { head: true, count: "exact" }).limit(1);
      if (probe.error && !String(probe.error.message || "").includes("relation")) {
        throw probe.error;
      }
      if (!probe.error || String(probe.error.message || "").includes("relation")) {
        // If relation missing, we still don't use Supabase (no schema). Otherwise, enable it.
        useSupabase = !probe.error;
      }
    } catch (e) {
      useSupabase = false;
    }
    if (useSupabase) {
      useMemory = false;
      initialized = true;
      return;
    }
    console.warn("Supabase not ready (schema missing). Falling back to alternate storage.");
  }
  try {
    await connectMongo();
    useMemory = false;
  } catch (e) {
    console.warn(
      "No database configured or connection failed. Falling back to in-memory storage for this session.",
    );
    useMemory = true;
  }
  initialized = true;
}

// Helper to ensure init before operations
async function withInit<T>(fn: () => Promise<T>): Promise<T> {
  await init();
  return fn();
}

// User Management Functions
export const createUser = (userData: {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  role?: "user" | "admin" | "super_admin";
}): User => {
  throw new Error("createUser must be used asynchronously via createUserAsync()");
};

export async function createUserAsync(userData: {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  role?: "user" | "admin" | "super_admin";
}): Promise<User> {
  return withInit(async () => {
    const userId = randomUUID();
    const now = new Date().toISOString();

    const userRole =
      userData.role ||
      (userData.email.endsWith("@admin.investnaija.com")
        ? "super_admin"
        : userData.email.endsWith("@investnaija.com")
        ? "admin"
        : "user");

    const user: User = {
      id: userId,
      email: userData.email,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      kycStatus: "pending",
      status: "active",
      role: userRole,
      createdAt: now,
    };

    if (useSupabase) {
      const { data: existing, error: existErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();
      if (existErr && existErr.code !== "PGRST116") throw existErr;
      if (existing) throw new Error("User with this email already exists");

      const { error: insertErr } = await supabase.from("users").insert({
        id: userId,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        kycStatus: user.kycStatus,
        status: user.status,
        role: user.role,
        createdAt: now,
        password: userData.password,
      });
      if (insertErr) throw insertErr;

      const { error: walletErr } = await supabase.from("wallets").insert({
        userId,
        balance: 0,
        totalInvested: 0,
        totalReturns: 0,
        lastUpdated: now,
      });
      if (walletErr) throw walletErr;
      return user;
    }

    if (useMemory) {
      if (memory.users.find((u) => u.email === user.email)) {
        throw new Error("User with this email already exists");
      }
      memory.users.push({ ...user, password: userData.password });
      memory.wallets.set(userId, {
        userId,
        balance: 0,
        totalInvested: 0,
        totalReturns: 0,
        lastUpdated: now,
      } as UserWallet);
      return user;
    }

    const { users, wallets } = getCollections();
    await users.insertOne({ ...user, password: userData.password });
    await wallets.insertOne({
      userId,
      balance: 0,
      totalInvested: 0,
      totalReturns: 0,
      lastUpdated: now,
    } satisfies UserWallet);

    return user;
  });
}

export const getUserByEmail = (email: string): (User & { password: string }) | null => {
  throw new Error("getUserByEmail must be used asynchronously via getUserByEmailAsync()");
};

export async function getUserByEmailAsync(email: string): Promise<(User & { password: string }) | null> {
  return withInit(async () => {
    if (useSupabase) {
      const { data: doc, error } = await supabase
        .from("users")
        .select("id,email,phone,firstName,lastName,kycStatus,status,role,createdAt,lastLogin,password")
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      if (!doc) return null as any;
      const { password, ...rest } = doc as any;
      return { ...(rest as User), password } as any;
    }
    if (useMemory) {
      const doc = memory.users.find((u) => u.email === email);
      if (!doc) return null as any;
      const { password, ...rest } = doc as any;
      return { ...(rest as User), password } as any;
    }
    const { users } = getCollections();
    const doc = await users.findOne({ email });
    if (!doc) return null as any;
    const { password, _id, ...rest } = doc as any;
    return { ...(rest as User), password } as any;
  });
}

export const getUserById = (userId: string): User | null => {
  throw new Error("getUserById must be used asynchronously via getUserByIdAsync()");
};

export async function getUserByIdAsync(userId: string): Promise<User | null> {
  return withInit(async () => {
    if (useSupabase) {
      const { data: doc, error } = await supabase
        .from("users")
        .select("id,email,phone,firstName,lastName,kycStatus,status,role,createdAt,lastLogin")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (doc as any) || null;
    }
    if (useMemory) {
      const doc = memory.users.find((u) => u.id === userId);
      if (!doc) return null;
      const { password, ...rest } = doc as any;
      return rest as User;
    }
    const { users } = getCollections();
    const doc = await users.findOne({ id: userId });
    if (!doc) return null;
    const { password, _id, ...user } = doc as any;
    return user as User;
  });
}

export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  throw new Error("updateUser must be used asynchronously via updateUserAsync()");
};

export async function updateUserAsync(userId: string, updates: Partial<User>): Promise<User | null> {
  return withInit(async () => {
    if (useSupabase) {
      const updatesClean: any = { ...updates };
      const { data, error } = await supabase
        .from("users")
        .update(updatesClean)
        .eq("id", userId)
        .select("id,email,phone,firstName,lastName,kycStatus,status,role,createdAt,lastLogin")
        .single();
      if (error) throw error;
      return data as any;
    }
    if (useMemory) {
      const idx = memory.users.findIndex((u) => u.id === userId);
      if (idx === -1) return null;
      const next = { ...(memory.users[idx] as any), ...updates } as any;
      memory.users[idx] = next;
      const { password, ...rest } = next;
      return rest as User;
    }
    const { users } = getCollections();
    const current = await users.findOne({ id: userId });
    if (!current) return null;

    const next = { ...(current as any), ...updates } as any;
    await users.updateOne(
      { id: userId },
      {
        $set: {
          email: next.email,
          phone: next.phone,
          firstName: next.firstName,
          lastName: next.lastName,
          bvn: next.bvn ?? null,
          nin: next.nin ?? null,
          kycStatus: next.kycStatus,
          status: next.status,
          lastLogin: next.lastLogin ?? null,
        },
      }
    );

    const { password, _id, ...rest } = next;
    return rest as User;
  });
}

// Session Management
export const createSession = (userId: string): string => {
  throw new Error("createSession must be used asynchronously via createSessionAsync()");
};

export async function createSessionAsync(userId: string): Promise<string> {
  return withInit(async () => {
    const token = randomUUID();
    const now = new Date().toISOString();
    if (useSupabase) {
      const { error: sErr } = await supabase
        .from("user_sessions")
        .insert({ token, userId, createdAt: now });
      if (sErr) throw sErr;
      await supabase.from("users").update({ lastLogin: now }).eq("id", userId);
      return token;
    }
    if (useMemory) {
      memory.sessions.set(token, { token, userId, createdAt: now });
      const idx = memory.users.findIndex((u) => u.id === userId);
      if (idx >= 0) memory.users[idx].lastLogin = now;
      return token;
    }
    const { sessions, users } = getCollections();
    await sessions.insertOne({ token, userId, createdAt: now });
    await users.updateOne({ id: userId }, { $set: { lastLogin: now } });
    return token;
  });
}

export const getSessionUser = (token: string): User | null => {
  throw new Error("getSessionUser must be used asynchronously via getSessionUserAsync()");
};

export async function getSessionUserAsync(token: string): Promise<User | null> {
  return withInit(async () => {
    if (useSupabase) {
      const { data: session, error: sErr } = await supabase
        .from("user_sessions")
        .select("userId")
        .eq("token", token)
        .maybeSingle();
      if (sErr) throw sErr;
      if (!session) return null;
      const { data: user, error: uErr } = await supabase
        .from("users")
        .select("id,email,phone,firstName,lastName,kycStatus,status,role,createdAt,lastLogin")
        .eq("id", (session as any).userId)
        .maybeSingle();
      if (uErr) throw uErr;
      return (user as any) || null;
    }
    if (useMemory) {
      const session = memory.sessions.get(token);
      if (!session) return null;
      const user = memory.users.find((u) => u.id === session.userId);
      if (!user) return null;
      const { password, ...rest } = user as any;
      return rest as User;
    }
    const { sessions, users } = getCollections();
    const session = await sessions.findOne({ token });
    if (!session) return null;
    const user = await users.findOne({ id: (session as any).userId });
    if (!user) return null;
    const { password, _id, ...rest } = user as any;
    return rest as User;
  });
}

export const deleteSession = (token: string): boolean => {
  throw new Error("deleteSession must be used asynchronously via deleteSessionAsync()");
};

export async function deleteSessionAsync(token: string): Promise<boolean> {
  return withInit(async () => {
    if (useSupabase) {
      const { error } = await supabase.from("user_sessions").delete().eq("token", token);
      if (error) throw error;
      return true;
    }
    if (useMemory) {
      const existed = memory.sessions.delete(token);
      return existed;
    }
    const { sessions } = getCollections();
    const result = await sessions.deleteOne({ token });
    return result.deletedCount === 1;
  });
}

// Wallet Management
export const getUserWallet = (userId: string): UserWallet | null => {
  throw new Error("getUserWallet must be used asynchronously via getUserWalletAsync()");
};

export async function getUserWalletAsync(userId: string): Promise<UserWallet | null> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("wallets")
        .select("userId,balance,totalInvested,totalReturns,lastUpdated")
        .eq("userId", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as any) || null;
    }
    if (useMemory) {
      return (memory.wallets.get(userId) as any) || null;
    }
    const { wallets } = getCollections();
    return (await wallets.findOne({ userId })) as any;
  });
}

export const updateWallet = (
  userId: string,
  updates: Partial<Omit<UserWallet, "userId">>,
): UserWallet | null => {
  throw new Error("updateWallet must be used asynchronously via updateWalletAsync()");
};

export async function updateWalletAsync(
  userId: string,
  updates: Partial<Omit<UserWallet, "userId">>,
): Promise<UserWallet | null> {
  return withInit(async () => {
    const now = new Date().toISOString();
    if (useSupabase) {
      const { data, error } = await supabase
        .from("wallets")
        .update({ ...updates, lastUpdated: now })
        .eq("userId", userId)
        .select("userId,balance,totalInvested,totalReturns,lastUpdated")
        .single();
      if (error) throw error;
      return data as any;
    }
    if (useMemory) {
      const w = memory.wallets.get(userId);
      if (!w) return null;
      const next = { ...w, ...updates, lastUpdated: now } as any;
      memory.wallets.set(userId, next);
      return next as any;
    }
    const { wallets } = getCollections();
    const res = await wallets.findOneAndUpdate(
      { userId },
      { $set: { ...updates, lastUpdated: now } },
      { returnDocument: "after" }
    );
    return res.value as any;
  });
}

// Transaction Management
export const createTransaction = (
  transactionData: Omit<Transaction, "id" | "createdAt">,
): Transaction => {
  throw new Error("createTransaction must be used asynchronously via createTransactionAsync()");
};

export async function createTransactionAsync(
  transactionData: Omit<Transaction, "id" | "createdAt">,
): Promise<Transaction> {
  return withInit(async () => {
    const transactionId = randomUUID();
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...transactionData,
      id: transactionId,
      createdAt: now,
    };
    if (useSupabase) {
      const { error } = await supabase.from("transactions").insert(transaction as any);
      if (error) throw error;
      return transaction;
    }
    const { transactions } = getCollections();
    await transactions.insertOne({ ...transaction });
    return transaction;
  });
}

export const getUserTransactions = (
  userId: string,
  limit: number = 50,
): Transaction[] => {
  throw new Error("getUserTransactions must be used asynchronously via getUserTransactionsAsync()");
};

export async function getUserTransactionsAsync(
  userId: string,
  limit: number = 50,
): Promise<Transaction[]> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as any) || [];
    }
    const { transactions } = getCollections();
    const rows = await transactions
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return rows as any;
  });
}

export const getTransaction = (transactionId: string): Transaction | null => {
  throw new Error("getTransaction must be used asynchronously via getTransactionAsync()");
};

export async function getTransactionAsync(transactionId: string): Promise<Transaction | null> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .maybeSingle();
      if (error) throw error;
      return (data as any) || null;
    }
    const { transactions } = getCollections();
    return (await transactions.findOne({ id: transactionId })) as any;
  });
}

export const updateTransaction = (
  transactionId: string,
  updates: Partial<Transaction>,
): Transaction | null => {
  throw new Error("updateTransaction must be used asynchronously via updateTransactionAsync()");
};

export async function updateTransactionAsync(
  transactionId: string,
  updates: Partial<Transaction>,
): Promise<Transaction | null> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates as any)
        .eq("id", transactionId)
        .select("*")
        .single();
      if (error) throw error;
      return data as any;
    }
    const { transactions } = getCollections();
    const res = await transactions.findOneAndUpdate(
      { id: transactionId },
      { $set: { ...updates } },
      { returnDocument: "after" }
    );
    return res.value as any;
  });
}

// Investment Management
export const createInvestment = (
  investmentData: Omit<Investment, "id" | "createdAt" | "currentValue" | "returns">,
): Investment => {
  throw new Error("createInvestment must be used asynchronously via createInvestmentAsync()");
};

export async function createInvestmentAsync(
  investmentData: Omit<Investment, "id" | "createdAt" | "currentValue" | "returns">,
): Promise<Investment> {
  return withInit(async () => {
    const investmentId = randomUUID();
    const now = new Date().toISOString();
    const investment: Investment = {
      ...investmentData,
      id: investmentId,
      currentValue: investmentData.amount,
      returns: 0,
      createdAt: now,
    };
    if (useSupabase) {
      const { error } = await supabase.from("investments").insert(investment as any);
      if (error) throw error;
      return investment;
    }
    const { investments } = getCollections();
    await investments.insertOne(investment as any);
    return investment;
  });
}

export const getUserInvestments = (userId: string): Investment[] => {
  throw new Error("getUserInvestments must be used asynchronously via getUserInvestmentsAsync()");
};

export async function getUserInvestmentsAsync(userId: string): Promise<Investment[]> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    }
    const { investments } = getCollections();
    return (await investments.find({ userId }).sort({ createdAt: -1 }).toArray()) as any;
  });
}

export const updateInvestment = (
  investmentId: string,
  updates: Partial<Investment>,
): Investment | null => {
  throw new Error("updateInvestment must be used asynchronously via updateInvestmentAsync()");
};

export async function updateInvestmentAsync(
  investmentId: string,
  updates: Partial<Investment>,
): Promise<Investment | null> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("investments")
        .update(updates as any)
        .eq("id", investmentId)
        .select("*")
        .single();
      if (error) throw error;
      return data as any;
    }
    const { investments } = getCollections();
    const res = await investments.findOneAndUpdate(
      { id: investmentId },
      { $set: { ...updates } },
      { returnDocument: "after" }
    );
    return res.value as any;
  });
}

// Utility Functions
export const getAllUsers = (): User[] => {
  throw new Error("getAllUsers must be used asynchronously via getAllUsersAsync()");
};

export async function getAllUsersAsync(): Promise<User[]> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("users")
        .select("id,email,phone,firstName,lastName,kycStatus,status,role,createdAt,lastLogin");
      if (error) throw error;
      return ((data as any[]) || []).map((u) => u as User);
    }
    const { users } = getCollections();
    const rows = await users.find({}).toArray();
    return rows.map(({ password, _id, ...u }: any) => u as User);
  });
}

export const getUserCount = (): number => {
  throw new Error("getUserCount must be used asynchronously via getUserCountAsync()");
};

export async function getUserCountAsync(): Promise<number> {
  return withInit(async () => {
    if (useSupabase) {
      const { count, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    }
    const { users } = getCollections();
    return (await users.countDocuments({})) || 0;
  });
}

export const getTotalAUM = (): number => {
  throw new Error("getTotalAUM must be used asynchronously via getTotalAUMAsync()");
};

export async function getTotalAUMAsync(): Promise<number> {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("wallets")
        .select("totalInvested");
      if (error) throw error;
      return ((data as any[]) || []).reduce((sum, r: any) => sum + (r.totalInvested || 0), 0);
    }
    const { wallets } = getCollections();
    const agg = await wallets.aggregate([
      { $group: { _id: null, total: { $sum: "$totalInvested" } } },
    ]).toArray();
    return (agg[0]?.total as number) || 0;
  });
}

export const getActiveInvestmentCount = (): number => {
  throw new Error("getActiveInvestmentCount must be used asynchronously via getActiveInvestmentCountAsync()");
};

export async function getActiveInvestmentCountAsync(): Promise<number> {
  return withInit(async () => {
    if (useSupabase) {
      const { count, error } = await supabase
        .from("investments")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count || 0;
    }
    const { investments } = getCollections();
    return (await investments.countDocuments({ status: "active" })) || 0;
  });
}

export const getPendingKYCCount = (): number => {
  throw new Error("getPendingKYCCount must be used asynchronously via getPendingKYCCountAsync()");
};

export async function getPendingKYCCountAsync(): Promise<number> {
  return withInit(async () => {
    if (useSupabase) {
      const { count, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("kycStatus", "pending");
      if (error) throw error;
      return count || 0;
    }
    const { users } = getCollections();
    return (await users.countDocuments({ kycStatus: "pending" })) || 0;
  });
}

// Social Banking Functions
export const createSocialGroup = (groupData: {
  name: string;
  description?: string;
  targetAmount: number;
  createdBy: string;
  endDate?: string;
  category?: string;
}) => {
  throw new Error("createSocialGroup must be used asynchronously via createSocialGroupAsync()");
};

export async function createSocialGroupAsync(groupData: {
  name: string;
  description?: string;
  targetAmount: number;
  createdBy: string;
  endDate?: string;
  category?: string;
}) {
  return withInit(async () => {
    const { social_groups, group_members } = getCollections();
    const groupId = randomUUID();
    const now = new Date().toISOString();

    await social_groups.insertOne({
      id: groupId,
      name: groupData.name,
      description: groupData.description || "",
      targetAmount: groupData.targetAmount,
      currentAmount: 0,
      createdBy: groupData.createdBy,
      endDate: groupData.endDate || "",
      status: "active",
      category: groupData.category || "general",
      createdAt: now,
    });

    await group_members.insertOne({
      id: randomUUID(),
      groupId,
      userId: groupData.createdBy,
      contribution: 0,
      joinedAt: now,
      status: "active",
    });

    return {
      id: groupId,
      ...groupData,
      currentAmount: 0,
      status: "active",
      createdAt: now,
    };
  });
}

export const getUserSocialGroups = (userId: string) => {
  throw new Error("getUserSocialGroups must be used asynchronously via getUserSocialGroupsAsync()");
};

export async function getUserSocialGroupsAsync(userId: string) {
  return withInit(async () => {
    const { social_groups, group_members } = getCollections();

    const memberGroups = await group_members
      .find({ userId, status: "active" })
      .project({ groupId: 1 })
      .toArray();
    const groupIds = memberGroups.map((m: any) => m.groupId);

    const groups = await social_groups.find({ id: { $in: groupIds } }).toArray();

    // Enrich with counts
    return await Promise.all(
      groups.map(async (g: any) => {
        const memberCount = await group_members.countDocuments({ groupId: g.id });
        const totalContributionsAgg = await group_members
          .aggregate([
            { $match: { groupId: g.id } },
            { $group: { _id: null, total: { $sum: "$contribution" } } },
          ])
          .toArray();
        const totalContributions = totalContributionsAgg[0]?.total || 0;
        return { ...g, memberCount, totalContributions };
      })
    );
  });
}

export const getGroupMembers = (groupId: string) => {
  throw new Error("getGroupMembers must be used asynchronously via getGroupMembersAsync()");
};

export async function getGroupMembersAsync(groupId: string) {
  return withInit(async () => {
    const { group_members, users } = getCollections();
    const members = await group_members.find({ groupId, status: "active" }).toArray();
    const userIds = members.map((m: any) => m.userId);
    const usersMap = new Map<string, any>();
    const usersArr = await users
      .find({ id: { $in: userIds } })
      .project({ password: 0 })
      .toArray();
    usersArr.forEach((u: any) => usersMap.set(u.id, u));

    return members
      .sort((a: any, b: any) => (b.contribution || 0) - (a.contribution || 0))
      .map((m: any) => ({
        ...m,
        firstName: usersMap.get(m.userId)?.firstName,
        lastName: usersMap.get(m.userId)?.lastName,
        email: usersMap.get(m.userId)?.email,
      }));
  });
}

export const createMoneyRequest = (requestData: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason: string;
  dueDate?: string;
}) => {
  throw new Error("createMoneyRequest must be used asynchronously via createMoneyRequestAsync()");
};

export async function createMoneyRequestAsync(requestData: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason: string;
  dueDate?: string;
}) {
  return withInit(async () => {
    const { money_requests } = getCollections();
    const requestId = randomUUID();
    const now = new Date().toISOString();

    await money_requests.insertOne({
      id: requestId,
      ...requestData,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { id: requestId, ...requestData, status: "pending", createdAt: now, updatedAt: now };
  });
}

export const getUserMoneyRequests = (userId: string) => {
  throw new Error("getUserMoneyRequests must be used asynchronously via getUserMoneyRequestsAsync()");
};

export async function getUserMoneyRequestsAsync(userId: string) {
  return withInit(async () => {
    const { money_requests, users } = getCollections();
    const requests = await money_requests
      .find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
      .sort({ createdAt: -1 })
      .toArray();

    const involvedIds = Array.from(
      new Set(requests.flatMap((r: any) => [r.fromUserId, r.toUserId]))
    );
    const usersArr = await users
      .find({ id: { $in: involvedIds } })
      .project({ password: 0 })
      .toArray();
    const map = new Map(usersArr.map((u: any) => [u.id, u]));

    return requests.map((r: any) => ({
      ...r,
      fromFirstName: map.get(r.fromUserId)?.firstName,
      fromLastName: map.get(r.fromUserId)?.lastName,
      toFirstName: map.get(r.toUserId)?.firstName,
      toLastName: map.get(r.toUserId)?.lastName,
    }));
  });
}

export const createSocialPayment = (paymentData: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  message?: string;
  type: string;
  isPublic?: boolean;
}) => {
  throw new Error("createSocialPayment must be used asynchronously via createSocialPaymentAsync()");
};

export async function createSocialPaymentAsync(paymentData: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  message?: string;
  type: string;
  isPublic?: boolean;
}) {
  return withInit(async () => {
    const { social_payments } = getCollections();
    const paymentId = randomUUID();
    const now = new Date().toISOString();

    await social_payments.insertOne({
      id: paymentId,
      ...paymentData,
      createdAt: now,
    });

    return { id: paymentId, ...paymentData, createdAt: now };
  });
}

export const getUserSocialPayments = (userId: string) => {
  throw new Error("getUserSocialPayments must be used asynchronously via getUserSocialPaymentsAsync()");
};

export async function getUserSocialPaymentsAsync(userId: string) {
  return withInit(async () => {
    const { social_payments, users } = getCollections();
    const payments = await social_payments
      .find({ $or: [{ fromUserId: userId }, { toUserId: userId }, { isPublic: true }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const ids = Array.from(new Set(payments.flatMap((p: any) => [p.fromUserId, p.toUserId])));
    const usersArr = await users.find({ id: { $in: ids } }).project({ password: 0 }).toArray();
    const map = new Map(usersArr.map((u: any) => [u.id, u]));

    return payments.map((p: any) => ({
      ...p,
      fromFirstName: map.get(p.fromUserId)?.firstName,
      fromLastName: map.get(p.fromUserId)?.lastName,
      toFirstName: map.get(p.toUserId)?.firstName,
      toLastName: map.get(p.toUserId)?.lastName,
    }));
  });
}

export const getFinancialChallenges = () => {
  throw new Error("getFinancialChallenges must be used asynchronously via getFinancialChallengesAsync()");
};

export async function getFinancialChallengesAsync() {
  return withInit(async () => {
    const { financial_challenges, challenge_participants } = getCollections();
    const challenges = await financial_challenges.find({}).sort({ createdAt: -1 }).toArray();

    return await Promise.all(
      challenges.map(async (c: any) => {
        const participantCount = await challenge_participants.countDocuments({ challengeId: c.id });
        return { ...c, participantCount };
      })
    );
  });
}

export const getChallengeParticipants = (challengeId: string) => {
  throw new Error("getChallengeParticipants must be used asynchronously via getChallengeParticipantsAsync()");
};

export async function getChallengeParticipantsAsync(challengeId: string) {
  return withInit(async () => {
    const { challenge_participants, users } = getCollections();
    const parts = await challenge_participants.find({ challengeId }).toArray();
    const userIds = parts.map((p: any) => p.userId);
    const usersArr = await users.find({ id: { $in: userIds } }).project({ password: 0 }).toArray();
    const map = new Map(usersArr.map((u: any) => [u.id, u]));

    return parts
      .sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0) || (a.joinedAt || ``).localeCompare(b.joinedAt || ``))
      .map((p: any) => ({ ...p, firstName: map.get(p.userId)?.firstName, lastName: map.get(p.userId)?.lastName }));
  });
}

// Notification Functions
export const createNotification = (notificationData: {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  metadata?: any;
}) => {
  throw new Error("createNotification must be used asynchronously via createNotificationAsync()");
};

export async function createNotificationAsync(notificationData: {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  metadata?: any;
}) {
  return withInit(async () => {
    const notificationId = randomUUID();
    const now = new Date().toISOString();

    if (useSupabase) {
      const { error } = await supabase.from("notifications").insert({
        id: notificationId,
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority || "normal",
        metadata: notificationData.metadata || null,
        createdAt: now,
        read: false,
      });
      if (error) throw error;
      return {
        id: notificationId,
        ...notificationData,
        read: false,
        createdAt: now,
      };
    }

    const { notifications } = getCollections();
    await notifications.insertOne({
      id: notificationId,
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      priority: notificationData.priority || "normal",
      metadata: notificationData.metadata || null,
      createdAt: now,
      read: false,
    });

    return {
      id: notificationId,
      ...notificationData,
      read: false,
      createdAt: now,
    };
  });
}

export const getUserNotificationsFromDB = (
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false,
) => {
  throw new Error("getUserNotificationsFromDB must be used asynchronously via getUserNotificationsFromDBAsync()");
};

export async function getUserNotificationsFromDBAsync(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false,
) {
  return withInit(async () => {
    if (useSupabase) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("userId", userId)
        .eq(unreadOnly ? "read" : "userId", unreadOnly ? false : userId)
        .order("createdAt", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as any[]) || [];
    }
    const { notifications } = getCollections();
    const query = unreadOnly ? { userId, read: false } : { userId };
    const rows = await notifications.find(query).sort({ createdAt: -1 }).limit(limit).toArray();
    return rows as any[];
  });
}

// Initialize sample data
export const createSampleChallenges = () => {
  throw new Error("createSampleChallenges must be used asynchronously via createSampleChallengesAsync()");
};

export async function createSampleChallengesAsync() {
  return withInit(async () => {
    const { financial_challenges } = getCollections();

    const challenges = [
      {
        id: randomUUID(),
        title: "30-Day Savings Challenge",
        description: "Save ₦1,000 more each day for 30 days",
        targetAmount: 30000,
        duration: 30,
        startDate: "2024-12-01",
        endDate: "2024-12-31",
        status: "active",
        category: "savings",
        createdAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        title: "Investment Growth Challenge",
        description: "Invest ₦50,000 and track your returns over 3 months",
        targetAmount: 50000,
        duration: 90,
        startDate: "2024-12-01",
        endDate: "2025-03-01",
        status: "active",
        category: "investment",
        createdAt: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        title: "Zero Spending Week",
        description:
          "Challenge yourself to spend only on essentials for one week",
        targetAmount: 0,
        duration: 7,
        startDate: "2024-12-16",
        endDate: "2024-12-23",
        status: "upcoming",
        category: "spending",
        createdAt: new Date().toISOString(),
      },
    ];

    await Promise.all(
      challenges.map((c) =>
        financial_challenges.updateOne(
          { id: c.id },
          { $setOnInsert: c },
          { upsert: true }
        )
      )
    );
  });
}
