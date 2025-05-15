import { create } from 'zustand';
import type { PrivateChatResultType } from '../types';

export const usePrivateMessagesStore = create<{
  allPrivateMessagesRoomMessages: PrivateChatResultType[];
  setAllPrivateMessagesRoomMessages: (msgs: PrivateChatResultType[]) => void;
  optimisticUpdate: (msg: PrivateChatResultType) => void;
}>()((set) => ({
  allPrivateMessagesRoomMessages: [],
  setAllPrivateMessagesRoomMessages: (msgs: PrivateChatResultType[]) =>
    set({ allPrivateMessagesRoomMessages: msgs }),
  optimisticUpdate: (msg: PrivateChatResultType) =>
    set((state: { allPrivateMessagesRoomMessages: PrivateChatResultType[] }) => ({
      allPrivateMessagesRoomMessages: [...state.allPrivateMessagesRoomMessages, msg],
    })),
}));
