import { v5 as uuidv5 } from 'uuid';

export class ObfuscatedChatKey {
  private static readonly NAMESPACE = process.env.OBFUSCATED_CHAT_KEY_NAMESPACE;

  static getObfuscatedChatKey(...userIds: number[]): string {
    if (!ObfuscatedChatKey.NAMESPACE) {
      throw new Error('OBFUSCATED_CHAT_KEY_NAMESPACE is not set');
    }
    if (userIds.length === 0) {
      throw new Error('At least one userId must be provided');
    }

    if (userIds.some((id) => !Number.isFinite(id))) {
      throw new TypeError('userIds must be finite numbers');
    }

    const key = userIds.sort((a, b) => a - b).join('_');
    return uuidv5(key, ObfuscatedChatKey.NAMESPACE);
  }
}
