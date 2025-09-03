import { MongoClient, Db, Collection } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

const DB_NAME = process.env.MONGO_DB_NAME || "investnaija";

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("MONGO_URI not set. Please configure MONGO_URI environment variable.");
  }

  client = new MongoClient(uri, {
    // Stable defaults; pool managed internally
    maxPoolSize: 20,
  });
  await client.connect();
  db = client.db(DB_NAME);

  await ensureIndexes(db);
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error("MongoDB not initialized. Call connectMongo() first.");
  return db;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

async function ensureIndexes(database: Db) {
  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("user_sessions").createIndex({ token: 1 }, { unique: true }),
    database.collection("user_sessions").createIndex({ userId: 1 }),
    database.collection("wallets").createIndex({ userId: 1 }, { unique: true }),
    database.collection("transactions").createIndex({ userId: 1, createdAt: -1 }),
    database.collection("investments").createIndex({ userId: 1, createdAt: -1 }),
    database.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
    database.collection("social_groups").createIndex({ createdBy: 1, createdAt: -1 }),
    database.collection("group_members").createIndex({ groupId: 1, userId: 1 }, { unique: true }),
    database.collection("money_requests").createIndex({ fromUserId: 1, toUserId: 1, createdAt: -1 }),
    database.collection("social_payments").createIndex({ fromUserId: 1, toUserId: 1, createdAt: -1 }),
    database.collection("financial_challenges").createIndex({ createdAt: -1 }),
    database.collection("challenge_participants").createIndex({ challengeId: 1, userId: 1 }, { unique: true }),
    database.collection("crypto_holdings").createIndex({ userId: 1, symbol: 1 }, { unique: true }),
    database.collection("business_profiles").createIndex({ userId: 1 }),
    database.collection("cards").createIndex({ userId: 1, cardNumber: 1 }, { unique: true }),
  ]).catch(() => {});
}

export type MongoCollections = {
  users: Collection;
  sessions: Collection;
  wallets: Collection;
  transactions: Collection;
  investments: Collection;
  notifications: Collection;
  social_groups: Collection;
  group_members: Collection;
  money_requests: Collection;
  social_payments: Collection;
  financial_challenges: Collection;
  challenge_participants: Collection;
  crypto_holdings: Collection;
  business_profiles: Collection;
  cards: Collection;
};

export function getCollections(): MongoCollections {
  const database = getDb();
  return {
    users: database.collection("users"),
    sessions: database.collection("user_sessions"),
    wallets: database.collection("wallets"),
    transactions: database.collection("transactions"),
    investments: database.collection("investments"),
    notifications: database.collection("notifications"),
    social_groups: database.collection("social_groups"),
    group_members: database.collection("group_members"),
    money_requests: database.collection("money_requests"),
    social_payments: database.collection("social_payments"),
    financial_challenges: database.collection("financial_challenges"),
    challenge_participants: database.collection("challenge_participants"),
    crypto_holdings: database.collection("crypto_holdings"),
    business_profiles: database.collection("business_profiles"),
    cards: database.collection("cards"),
  };
}
