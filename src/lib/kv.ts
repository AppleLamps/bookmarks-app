import { Redis } from "@upstash/redis";
import { Bookmark, UserKVData } from "@/types";

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

function bookmarksKey(xUserId: string): string {
  return `bookmarks:${xUserId}`;
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

export async function getCachedBookmarks(xUserId: string): Promise<Bookmark[]> {
  const data = await getRedis().get<Bookmark[]>(bookmarksKey(xUserId));
  return data || [];
}

export async function appendCachedBookmarks(xUserId: string, newBookmarks: Bookmark[]): Promise<void> {
  const existing = await getCachedBookmarks(xUserId);
  const combined = [...existing, ...newBookmarks];
  await getRedis().set(bookmarksKey(xUserId), combined, { ex: TTL_SECONDS });
}

export async function deleteCachedBookmarks(xUserId: string): Promise<void> {
  await getRedis().del(bookmarksKey(xUserId));
}
