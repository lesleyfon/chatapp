import { BookOpenCheck, LayoutDashboard, MessageCircle } from "lucide-react";
import { type NavItem } from "./../types/index";

export const NavItems: NavItem[] = [
	{
		title: "Dashboard",
		icon: LayoutDashboard,
		href: "/",
		color: "text-sky-500",
	},
	{
		title: "Example",
		icon: BookOpenCheck,
		href: "/example",
		color: "text-sky-500",
	},
	{
		title: "Example - 2",
		icon: MessageCircle,
		href: "/example",
		color: "text-sky-500",
	},
];
