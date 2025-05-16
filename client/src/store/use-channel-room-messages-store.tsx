import { create } from 'zustand';

import type { RoomMessagesResponse } from '../types';

/**
 * @description This is a store for the channel room messages.
 * @returns {Object} The store object.
 */
export const useChannelRoomMessages = create<{
  currentChannelRoomMessages: RoomMessagesResponse[];
  setCurrentChannelRoomMessages: (messages: RoomMessagesResponse[]) => void;
  addMessages: (messages: RoomMessagesResponse[]) => void;
}>((set) => ({
  currentChannelRoomMessages: [],
  /**
   * @description This is a function that sets the current channel room messages.
   * @param messages - The messages to set.
   * @returns {void}
   */
  setCurrentChannelRoomMessages: (messages) => set({ currentChannelRoomMessages: messages }),
  /**
   * @description This is a function that adds messages to the current channel room messages.
   * @param messages - The messages to add.
   * @returns {void}
   */
  addMessages: (messages) =>
    set((state) => ({
      currentChannelRoomMessages: [...state.currentChannelRoomMessages, ...messages],
    })),
}));
