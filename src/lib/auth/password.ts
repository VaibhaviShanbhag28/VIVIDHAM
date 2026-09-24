import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id password hashing (OWASP-recommended parameters:
 * m=19 MiB, t=2, p=1). The algorithm/params are encoded in the hash string,
 * so they can be raised later without breaking existing hashes.
 */
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/** Used when the email is unknown so response timing does not reveal whether an account exists. */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword("timing-equaliser-not-a-real-password");
  await verifyPassword(await dummyHash, password);
}
