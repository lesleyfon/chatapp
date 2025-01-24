import { type FC } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../../lib/utils";
import Authentication from "../authentication/Authentication";
import Header from "../../components/layout/nav";
import Sidebar from "../../components/layout/nav/sidebar";
import ChatRoomLayout from "../../components/layout/chat-room";

export const ProtectedRoute: FC<{ isAuthenticated: () => boolean }> = ({ isAuthenticated }) => {
	return isAuthenticated() ? <Outlet /> : <Navigate to="/" replace />;
};

const MainLayout = () => (
	<div className="h-screen border-collapse overflow-hidden w-screen">
		<main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1 grid md:grid-cols-[1fr_11fr]">
			<Sidebar className="relative hidden h-full md:grid" />
			<div className="grid grid-rows-[1fr_11fr] h-screen">
				<Header />
				<Outlet />
			</div>
		</main>
	</div>
);

export const AppRouter = createBrowserRouter([
	{
		path: "/",
		element: <Authentication />,
	},
	{
		element: <ProtectedRoute isAuthenticated={isAuthenticated} />,
		children: [
			{
				element: <MainLayout />,
				children: [
					{
						path: "/chats",
						element: null, // Empty view when no chat is selected
					},
					{
						path: "/chats/:chatId",
						element: <ChatRoomLayout />, // OUTLET
					},
					{
						path: "/private-chats/:recipientId",
						element: <ChatRoomLayout />, // OUTLET
					},
				],
			},
		],
	},
	{
		path: "*",
		element: <p>404 Error - Nothing here...</p>,
	},
]);
