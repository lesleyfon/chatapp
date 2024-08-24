import "./App.css";
import { Routes, Route } from "react-router-dom";
import Authentication from "./pages/authentication/Authentication";
// import { Chats } from "./pages/chat";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./components/layout/nav/sidebar";
import ChatRoomLayout from "./components/layout/chat-room";

// Create a client
const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<Routes>
				<Route path="/" element={<Authentication />} />

				<Route
					path="/chats/:chatId"
					element={
						<div className="flex h-screen border-collapse overflow-hidden w-screen">
							<Sidebar />
							<main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1">
								<ChatRoomLayout />
							</main>
						</div>
					}
				/>
			</Routes>
		</QueryClientProvider>
	);
}

export default App;
