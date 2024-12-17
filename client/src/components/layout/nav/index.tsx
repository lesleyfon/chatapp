import { ReactNode, useState } from "react";
import { JoinRoom } from "../../join-room";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../../api/http-methods";
import { LogoutButton } from "../../logout-button";
import { Menu, TriangleAlert } from "lucide-react";
import { Button } from "../../ui/button";
import { MobileSidebar } from "./mobile-nav";
import "./style.css";
import { useSidebar } from "../../ui/sidebar";

function NavActions(): ReactNode {
	return (
		<div className="flex items-center justify-center h-full">
			<JoinRoom />
			<LogoutButton />
		</div>
	);
}

function MobileNav(): ReactNode {
	const [open, setOpen] = useState(false);
	const { setOpenMobile } = useSidebar();
	return (
		<>
			<nav className="flex md:hidden items-center justify-between bg-[#242424] shadow-md h-full px-6 w-full content-center flex-wrap">
				<Button
					className="p-0"
					onClick={() => {
						setOpen(true);
						setOpenMobile(true);
					}}
				>
					<Menu />
				</Button>
				<LogoutButton />
			</nav>
			<MobileSidebar open={open} setOpen={setOpen} />
		</>
	);
}

function Desktop({ roomName }: { roomName: string }): ReactNode {
	return (
		<nav className=" md:flex hidden items-center justify-between bg-[#242424] shadow-md h-full w-full content-center flex-wrap px-6">
			<div>
				<div className="font-semibold">{roomName}</div>
				<div className="text-xs text-muted-foreground">
					<span className="inline-flex bg-green-400 rounded-full w-2 h-2"></span>
					<span className="ml-1">
						Online <strong>9</strong>
					</span>
				</div>
			</div>
			<NavActions />
		</nav>
	);
}

function Header(): ReactNode {
	const { chatId } = useParams();

	const { isPending, data, isFetching } = useQuery({
		queryKey: [chatId], // Makes another call when chatId changes
		queryFn: chatId ? () => api.fetchChatListsDataFromChatId(chatId) : undefined,
	});

	if ((isFetching || isPending) && chatId) {
		return <Desktop roomName="FETCHING DATA" />;
	}

	if (data?.error) {
		return (
			<>
				<MobileNav />
				<nav className=" md:flex hidden items-center justify-between bg-[#242424] shadow-md h-full w-full content-center flex-wrap px-6">
					<p className="flex items-center justify-center h-full text-red-500 text-2xl">
						Chat Room Not Found <TriangleAlert className="w-6 h-6" />
					</p>
					<NavActions />
				</nav>
			</>
		);
	}

	const roomName = data?.msg?.[0]?.chats?.chat_name ?? "Chat App";

	return (
		<header className="supports-backdrop-blur:bg-background/60 left-0 right-0 top-0 z-20 bg-background/95 backdrop-blur">
			<Desktop roomName={roomName} />
			<MobileNav />
		</header>
	);
}

export default Header;
