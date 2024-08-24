import ChatRoomLayout from "../../components/layout/chat-room";
import Sidebar from "../../components/layout/nav/sidebar";

export const Chats = () => {
	return (
		<>
			<div className="flex h-screen border-collapse overflow-hidden w-screen">
				<Sidebar />
				<main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1">
					<ChatRoomLayout />
				</main>
			</div>
		</>
	);
};
