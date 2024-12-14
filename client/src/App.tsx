import "./App.css";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouter } from "./pages/AppRouter";
import { SidebarProvider } from "./components/ui/sidebar";

// Create a client
const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<SidebarProvider>
				<RouterProvider router={AppRouter} />
			</SidebarProvider>
		</QueryClientProvider>
	);
}

export default App;
