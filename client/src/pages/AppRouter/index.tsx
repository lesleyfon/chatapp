import { type FC } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { getBearer } from "../../lib/utils";
import Authentication from "../authentication/Authentication";
import Header from "../../components/layout/nav";
import Sidebar from "../../components/layout/nav/sidebar";
import ChatRoomLayout from "../../components/layout/chat-room";

// Function to check if the user is authenticated
const isAuthenticated = () => {
	return !!getBearer();
};
export const ProtectedRoute: FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
	return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const MainAppLayoutWithSidebarAndChatroom = () => (
	<div className="h-screen border-collapse overflow-hidden w-screen grid grid-rows-[1fr_11fr]">
		<Header />
		<main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1 grid md:grid-cols-[1fr_11fr]">
			<Sidebar className="relative hidden h-full border-r md:grid grid-rows-[62px_auto]" />
			<ChatRoomLayout />
		</main>
	</div>
);

export const AppRouter = createBrowserRouter([
	{
		path: "/",
		element: <Authentication />,
	},
	{
		element: <ProtectedRoute isAuthenticated={isAuthenticated()} />,
		children: [
			{
				path: "/chats",
				element: (
					<div className="h-screen border-collapse overflow-hidden w-screen grid grid-rows-[1fr_11fr]">
						<Header />
						<main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1 grid md:grid-cols-[1fr_11fr]">
							<Sidebar className="relative hidden h-full border-r md:grid grid-rows-[62px_auto]" />
						</main>
					</div>
				),
			},
			{
				path: "/chats/:chatId",
				element: <MainAppLayoutWithSidebarAndChatroom />,
			},
			{
				path: "/private-chats/:recipientId",
				element: <MainAppLayoutWithSidebarAndChatroom />,
			},
		],
	},
	{
		path: "*",
		element: <p>404 Error - Nothing here...</p>,
	},
]);
