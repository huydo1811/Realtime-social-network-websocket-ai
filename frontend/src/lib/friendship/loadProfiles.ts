import type { ProfileInfo } from "@/components/user/profile/types";
import { getUserById } from "@/lib/api/userApi";

export async function loadProfilesByIds(ids: number[]): Promise<Map<number, ProfileInfo>> {
  const unique = [...new Set(ids)];
  const map = new Map<number, ProfileInfo>();
  await Promise.all(
    unique.map(async (id) => {
      try {
        const p = await getUserById(String(id));
        map.set(id, p);
      } catch {
        /* skip missing user */
      }
    })
  );
  return map;
}
