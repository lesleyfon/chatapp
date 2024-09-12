import "./App.css";
import { Routes, Route } from "react-router-dom";
import Authentication from "./pages/authentication/Authentication";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./components/layout/nav/sidebar";
import ChatRoomLayout from "./components/layout/chat-room";
import Header from "./components/layout/nav";

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
						<div className="h-screen border-collapse overflow-hidden w-screen grid grid-rows-[1fr_11fr]">
							<Header />
							<main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1 grid md:grid-cols-[1fr_11fr]">
								<Sidebar className="relative hidden h-full border-r md:block" />
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
