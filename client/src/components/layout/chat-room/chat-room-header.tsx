import { Home } from "lucide-react";
import { Avatar, AvatarFallback } from "../../ui/avatar";

export const ChatRoomHeader = ({ roomName }: { roomName: string }) => {
	return (
		<div className="border-b flex items-center bg-[#242424] shadow-md">
			<Avatar className="h-20 w-10 mx-2">
				<AvatarFallback>
					<Home />
				</AvatarFallback>
			</Avatar>
			<div>
				<div className="font-semibold">{roomName}</div>
				<div className="text-xs text-muted-foreground">
					<span className="inline-flex bg-green-400 rounded-full w-2 h-2"></span>
					<span className="ml-1">
						Online <strong>9</strong>
					</span>
				</div>
			</div>
		</div>
	);
};
