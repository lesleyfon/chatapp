import { ReactNode, useState, type FC } from "react";
import { JoinRoom } from "../../join-room";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../../api/http-methods";
import { LogoutButton } from "../../logout-button";
import { Menu } from "lucide-react";
import { Button } from "../../ui/button";
import { MobileSidebar } from "./mobile-nav";

const MobileNav: FC = (): ReactNode => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<nav className="flex md:hidden items-center justify-between bg-[#242424] shadow-md h-full px-6 w-full content-center flex-wrap">
				<Button className="p-0" onClick={() => setOpen(true)}>
					<Menu />
				</Button>
				<LogoutButton />
			</nav>
			<MobileSidebar open={open} setOpen={setOpen} />
		</>
	);
};

const Desktop: FC<{ roomName: string }> = ({ roomName }): ReactNode => {
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
			<div className="">
				<JoinRoom />
				<LogoutButton />
			</div>
		</nav>
	);
};

const Header: FC = (): ReactNode => {
	const { chatId } = useParams();

	const { isPending, data, isFetching } = useQuery({
		queryKey: [chatId], // Makes another call when chatId changes
		queryFn: chatId ? () => api.fetchChatListsDataFromChatId(chatId) : undefined,
	});

	if ((isFetching || isPending) && chatId) {
		return <Desktop roomName="FETCHING DATA" />;
	}

	if (data?.error) {
		return <p>Error</p>;
	}

	const roomName = data?.msg?.[0]?.chats?.chat_name ?? "Chat App";

	return (
		<header className="supports-backdrop-blur:bg-background/60 left-0 right-0 top-0 z-20 border-b bg-background/95 backdrop-blur">
			<Desktop roomName={roomName} />
			<MobileNav />
		</header>
	);
};

export default Header;
