import { useState, useEffect } from "react";
import { MenuIcon } from "lucide-react";
import Sidebar from "./sidebar";
import { Sheet, SheetContent, SheetTrigger } from "../../ui/sheet";

export const MobileSidebar = () => {
	const [open, setOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<div className="block md:!hidden mx-5">
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>
					<div className="flex items-center justify-center ">
						<MenuIcon />
					</div>
				</SheetTrigger>
				<SheetContent side="left" className="w-72 p-0 br-0">
					<div className="px-1 py-6 pt-16">
						<Sidebar className="block md:hidden h-screen border-0" />
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
};
