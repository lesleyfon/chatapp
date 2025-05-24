import ChatRoomLayout from '../../components/layout/chat-room';

export function Chats() {
  return (
    <div className='flex w-screen h-screen overflow-hidden border-collapse'>
      <main className='flex-1 pb-1 overflow-x-hidden overflow-y-auto bg-secondary/10'>
        <ChatRoomLayout />
      </main>
    </div>
  );
}
