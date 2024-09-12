import { ReactNode, type FC } from "react";
import { JoinRoom } from "../../join-room";

const MobileNav: FC = (): ReactNode => {
	return (
		<nav className="flex md:hidden items-center justify-between bg-[#242424] shadow-md h-full mx-6 w-full content-center flex-wrap">
			Mobile
		</nav>
	);
};

const Desktop: FC = (): ReactNode => {
	const roomName = "Room Name";
	return (
		<nav className=" md:flex hidden items-center justify-between bg-[#242424] shadow-md h-full mx-6 w-full content-center flex-wrap">
			<div>
				<div className="font-semibold">{roomName}</div>
				<div className="text-xs text-muted-foreground">
					<span className="inline-flex bg-green-400 rounded-full w-2 h-2"></span>
					<span className="ml-1">
						Online <strong>9</strong>
					</span>
				</div>
			</div>
			<JoinRoom />
		</nav>
	);
};
const Header: FC = (): ReactNode => {
	return (
		<header className="supports-backdrop-blur:bg-background/60 left-0 right-0 top-0 z-20 border-b bg-background/95 backdrop-blur">
			<Desktop />
			<MobileNav />
		</header>
	);
};

export default Header;
