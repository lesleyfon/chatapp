import set from 'lodash/set';
import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import type { VListHandle } from 'virtua';

import { usePrivateMessagesStore } from '../store/use-private-messages-store';
import type { PrivateChatResultType } from '../types';
import { useSocket } from './use-socket';

export function useAddPrivateMessageResponse({
  userId,
  vListRef,
}: {
  userId: string;
  vListRef: React.RefObject<VListHandle> | null;
}) {
  const navigate = useNavigate();
  const socket = useSocket();
  const { allPrivateMessagesRoomMessages, setAllPrivateMessagesRoomMessages } =
    usePrivateMessagesStore();
  const { uniquePrivateChatKey } = useParams();

  /**
   * @description Optimistic UI update for private messages
   * @param response - The private chat result type
   */
  function privateMessageOptimisticUIUpdate(response: PrivateChatResultType) {
    const responseCopy = { ...response };
    if (String(response.chat_user.pk_user_id) === String(userId)) {
      set(responseCopy, 'chat_user.name', 'You');
    }
    setAllPrivateMessagesRoomMessages([...allPrivateMessagesRoomMessages, responseCopy]);
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (socket?.connected === false) socket?.connect();
    if (!userId) return; // Maybe logout?

    socket?.on('add-private-message-response', (response: PrivateChatResultType) => {
      const { user_a_id, user_b_id, unique_chat_key } = response.private_chat;

      const isNewPrivateChat = response.private_chat?.isNewPrivateChat;

      const responseSenderId = response.private_messages.fk_user_id;
      const responseRecipientId = user_a_id === responseSenderId ? user_b_id : user_a_id;

      const privateChatUserIds = new Set([responseSenderId, responseRecipientId].map(String));
      // If the user is not part of the private chat, return early
      if (!privateChatUserIds.has(String(userId))) {
        return;
      }

      // If the unique chat key is not the same, return early and it is not a new private chat
      if (uniquePrivateChatKey !== unique_chat_key && !isNewPrivateChat) return;
      // since we are using optimistic UI updates to show the latest message sent, we can simply return early if the sender is the same as the current user
      if (responseSenderId === userId) {
        if (isNewPrivateChat) {
          navigate(`/private-chats/${unique_chat_key}`);
        }
        return;
      }

      const responseCopy = { ...response };
      if (String(response.chat_user.pk_user_id) === String(userId)) {
        set(responseCopy, 'chat_user.name', 'You');
      }

      // [...allPrivateMessagesRoomMessages, responseCopy]
      const updatedRoomMessages = [
        ...allPrivateMessagesRoomMessages.filter(
          (res) => res.private_messages.id !== responseCopy.private_messages.id,
        ),
        responseCopy,
      ];
      setAllPrivateMessagesRoomMessages(updatedRoomMessages);

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
  }, [socket, userId, allPrivateMessagesRoomMessages, uniquePrivateChatKey]);
  return {
    allPrivateMessagesRoomMessages,
    setAllPrivateMessagesRoomMessages,
    privateMessageOptimisticUIUpdate,
  };
}
