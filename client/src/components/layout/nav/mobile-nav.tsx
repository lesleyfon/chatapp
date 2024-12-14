import { useState, useEffect } from "react";
import Sidebar from "./sidebar";

import "./mobile-nav.css";
export const MobileSidebar = ({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		const eventListenerCallback = () => {
			const windowWidth = window.innerWidth;
			if (windowWidth >= 768 && open) {
				setOpen(false);
			}
		};
		window.addEventListener("resize", eventListenerCallback, true);
		return () => window.removeEventListener("resize", eventListenerCallback);
	});
	if (!isMounted) {
		return null;
	}

	return (
		<div className="block md:!hidden mx-5">
			<div className="px-1 py-6 pt-16">
				<Sidebar className="block md:hidden h-screen border-0 overflow-hidden" />
			</div>
		</div>
	);
};
