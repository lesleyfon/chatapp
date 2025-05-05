import { useEffect } from 'react';
import { set } from 'react-hook-form';
import type { Socket } from 'socket.io-client';
import type { VListHandle } from 'virtua';
import { usePrivateMessagesStore } from '../store/use-private-messages-store';
import type { PrivateChatResultType } from '../types';

export function useAddPrivateMessageResponse({
  socket,
  userId,
  vListRef,
  recipientId,
}: {
  userId: string;
  recipientId: string;
  socket: Socket | null;
  vListRef: React.RefObject<VListHandle> | null;
}) {
  const { allRoomMessages, setAllRoomMessages } = usePrivateMessagesStore();

  /**
   * @description Optimistic UI update for private messages
   * @param response - The private chat result type
   */
  function privateMessageOptimisticUIUpdate(response: PrivateChatResultType) {
    const responseCopy = { ...response };
    if (String(response.chat_user.pk_user_id) === String(userId)) {
      set(responseCopy, 'chat_user.name', 'You');
    }
    setAllRoomMessages([...allRoomMessages, responseCopy]);
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (socket?.connected === false) socket?.connect();
    if (!userId) return; // Maybe logout?

    socket?.on('add-private-message-response', (response: PrivateChatResultType) => {
      const { sender_id: responseSenderId, recipient_id: responseRecipientId } =
        response.private_chat;

      // since we are using optimistic UI updates to show the latest message sent, we can simply return early if the sender is the same as the current user
      if (responseSenderId === userId) return;

      const chatUser = new Set([responseSenderId, responseRecipientId]);

      // IF users are not the same, return early
      if (!chatUser.has(userId)) {
        return;
      }
      // Prevent messages from showing in other users chats
      const chatToUpdate =
        (responseSenderId.toString() === userId.toString() &&
          responseRecipientId.toString() === recipientId?.toString()) ||
        (responseSenderId.toString() === recipientId?.toString() &&
          responseRecipientId.toString() === userId.toString());

      if (chatToUpdate === false) return;

      const responseCopy = { ...response };
      if (String(response.chat_user.pk_user_id) === String(userId)) {
        set(responseCopy, 'chat_user.name', 'You');
      }
      const updatedRoomMessages = [...allRoomMessages, responseCopy];
      setAllRoomMessages(updatedRoomMessages);

      if (vListRef?.current) {
        // Scroll to bottom after new message is added
        vListRef?.current.scrollToIndex(updatedRoomMessages.length, {
          smooth: true,
          align: 'start',
        });
      }
    });
    return () => {
      socket?.off('add-private-message-response');
    };
  }, [socket, userId, allRoomMessages, recipientId]);
  return { allRoomMessages, setAllRoomMessages, privateMessageOptimisticUIUpdate };
}
