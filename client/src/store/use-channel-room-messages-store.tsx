import { create } from 'zustand';

import type { RoomMessagesResponse } from '../types';

/**
 * @description This is a store for the channel room messages.
 * @returns {Object} The store object.
 */
export const useChannelRoomMessages = create<{
  currentChannelRoomMessages: RoomMessagesResponse[];
  setCurrentChannelRoomMessages: (messages: RoomMessagesResponse[]) => void;
}>((set) => ({
  currentChannelRoomMessages: [],
  setCurrentChannelRoomMessages: (messages) => set({ currentChannelRoomMessages: messages }),
}));
