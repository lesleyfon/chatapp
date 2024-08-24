import { cn, timeDifference } from "../../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Button } from "../../ui/button";
import { PlusIcon } from "../../ui/avatar/index";
import { Link } from "react-router-dom";
import { SidebarProps } from "../../../types";
import { useGetChatList } from "../../../hooks/useGetChatList";

export default function Sidebar({ className }: SidebarProps) {
	const { chatList } = useGetChatList();

	return (
		<section className={cn(`relative hidden h-screen border-r md:block w-72`, className)}>
			<div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4">
				<div className="font-semibold">Chats</div>
				<Button
					variant="ghost"
					size="icon"
					className="p-0 bg-transparent  hover:bg-[#2f2f2f] rounded-[10%]"
				>
					<PlusIcon className="h-5 w-5" />
					<span className="sr-only">New Chat</span>
				</Button>
			</div>

			<nav className="grid gap-1 p-2">
				{chatList.length > 0 &&
					chatList.map((chatdata) => (
						<Link
							to={`/chats/${chatdata.chats?.pk_chats_id}`}
							className="flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors hover:bg-muted from-neutral-200"
							key={chatdata.chats?.pk_chats_id}
						>
							<Avatar className="h-8 w-8 border">
								<AvatarImage
									src="https://generated.vusercontent.net/placeholder-user.jpg"
									alt="Avatar"
								/>
								<AvatarFallback>JD</AvatarFallback>
							</Avatar>
							<div className="flex-1 truncate">
								<div className="from-neutral-100 font-bold">
									{chatdata.chats?.chat_name}
								</div>
								<div className="bottom-row flex gap-2 items-center w-full">
									<div className="w-full">
										<p className=" truncate w-full text-xs text-ellipsis overflow-hidden md:block md:w-44 ">
											{chatdata?.messages.message_text}
										</p>
									</div>
									<div className="text-xs text-muted-foreground">
										<p className="text-xs">
											{timeDifference(chatdata?.messages.sent_at)}
										</p>
									</div>
								</div>
							</div>
						</Link>
					))}
			</nav>
		</section>
	);
}
