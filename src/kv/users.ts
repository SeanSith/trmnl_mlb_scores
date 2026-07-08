import type { UserRecord } from '../mlb/types';

const key = (uuid: string) => `user:${uuid}`;

export async function getUser(kv: KVNamespace, uuid: string): Promise<UserRecord | null> {
  return kv.get<UserRecord>(key(uuid), 'json');
}

export async function putUser(kv: KVNamespace, uuid: string, record: UserRecord): Promise<void> {
  await kv.put(key(uuid), JSON.stringify(record));
}

export async function deleteUser(kv: KVNamespace, uuid: string): Promise<void> {
  await kv.delete(key(uuid));
}
