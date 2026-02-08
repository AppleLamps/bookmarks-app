import { Redis } from "@upstash/redis";
import { UserKVData } from "@/types";

let redis: Redis;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redis;
}

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function userKey(xUserId: string): string {
  return `user:${xUserId}`;
}

export async function getUserData(xUserId: string): Promise<UserKVData | null> {
  const data = await getRedis().get<UserKVData>(userKey(xUserId));
  return data;
}

export async function setUserData(xUserId: string, data: UserKVData): Promise<void> {
  await getRedis().set(userKey(xUserId), data, { ex: TTL_SECONDS });
}

export async function deleteUserData(xUserId: string): Promise<void> {
  await getRedis().del(userKey(xUserId));
}
