import { create } from 'zustand';
import type { PrivateChatResultType } from '../types';

export const usePrivateMessagesStore = create<{
  allRoomMessages: PrivateChatResultType[];
  setAllRoomMessages: (msgs: PrivateChatResultType[]) => void;
  optimisticUpdate: (msg: PrivateChatResultType) => void;
}>()((set) => ({
  allRoomMessages: [],
  setAllRoomMessages: (msgs: PrivateChatResultType[]) => set({ allRoomMessages: msgs }),
  optimisticUpdate: (msg: PrivateChatResultType) =>
    set((state: { allRoomMessages: PrivateChatResultType[] }) => ({
      allRoomMessages: [...state.allRoomMessages, msg],
    })),
}));
