import { create } from 'zustand';
import type { ChatListItem, ChatListType } from '../types/index';

function sortChatsByLatestMessage(chats: ChatListType): ChatListType {
  return [...chats].sort((a, b) => {
    const aTime = new Date(a.messages?.sent_at || 0).getTime();
    const bTime = new Date(b.messages?.sent_at || 0).getTime();
    return bTime - aTime; // Most recent first
  });
}

export const useLatestChannelRoomListStore = create<{
  latestChannelRoomList: ChatListType;
  setLatestChannelRoomList: (chatLatestRoomList: ChatListType) => void;
  updateSingleChat: (updatedChat: ChatListItem) => void;
}>((set) => ({
  latestChannelRoomList: [],
  setLatestChannelRoomList: (latestChannelRoomUpdates) =>
    set((prevState) => {
      // Initial Load
      if (prevState.latestChannelRoomList.length === 0 && latestChannelRoomUpdates.length > 0) {
        return { latestChannelRoomList: sortChatsByLatestMessage(latestChannelRoomUpdates) };
      }

      // For every chatlistitem in the prev chat, update only those that are part of the latest latestChannelRoomUpdates
      const updatedChats = prevState.latestChannelRoomList.map((chat) => {
        const update = latestChannelRoomUpdates.find(
          (update) => update.chats?.pk_chats_id === chat.chats?.pk_chats_id,
        );
        return update || chat;
      });

      // Add new chats
      const newChats = latestChannelRoomUpdates.filter(
        (update) =>
          !prevState.latestChannelRoomList.some(
            (chat) => chat.chats?.pk_chats_id === update.chats?.pk_chats_id,
          ),
      );

      return {
        latestChannelRoomList: sortChatsByLatestMessage([...updatedChats, ...newChats]),
      };
    }),
  updateSingleChat: (updatedChat: ChatListItem) =>
    set((prevState) => {
      const updatedList = prevState.latestChannelRoomList.map((chat) =>
        chat.chats?.pk_chats_id === updatedChat.chats?.pk_chats_id ? updatedChat : chat,
      );
      return {
        latestChannelRoomList: sortChatsByLatestMessage(updatedList),
      };
    }),
}));
