import dotenv from 'dotenv';
import { v5 as uuidv5 } from 'uuid';

dotenv.config();

export class ObfuscatedChatKey {
  private static readonly NAMESPACE = process.env.OBFUSCATED_CHAT_KEY_NAMESPACE;

  static getObfuscatedChatKey(...userIds: number[]) {
    if (!ObfuscatedChatKey.NAMESPACE) {
      throw new Error('OBFUSCATED_CHAT_KEY_NAMESPACE is not set');
    }
    const key = userIds.sort((a, b) => a - b).join('_');
    return uuidv5(key, ObfuscatedChatKey.NAMESPACE);
  }
}
