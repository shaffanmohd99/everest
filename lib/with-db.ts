import { connectDb } from "@/lib/db";

export async function withDb<T>(fn: () => Promise<T>) {
  await connectDb();
  return fn();
}
