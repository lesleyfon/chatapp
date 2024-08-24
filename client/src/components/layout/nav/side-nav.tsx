"use client";

import { cn } from "../../lib/utils";
import { SideNavProps } from "./../../types/index";
import { useSidebar } from "./../../hooks/useSidebar";
import { buttonVariants } from "./../ui/button";
import { useEffect, useState } from "react";

export function SideNav({ items, setOpen, className }: SideNavProps) {
	const { isOpen } = useSidebar();
	const [openItem, setOpenItem] = useState("");
	const [lastOpenItem, setLastOpenItem] = useState("");

	useEffect(() => {
		if (isOpen) {
			setOpenItem(lastOpenItem);
		} else {
			setLastOpenItem(openItem);
			setOpenItem("");
		}
	}, [isOpen]);

	return (
		<nav className="space-y-2">
			{items.map((item) => (
				<a
					key={item.title}
					href={item.href}
					onClick={() => {
						if (setOpen) setOpen(false);
					}}
					className={cn(
						buttonVariants({ variant: "ghost" }),
						"group relative flex h-12 justify-start"
					)}
				>
					<item.icon className={cn("h-5 w-5", item.color)} />
					<span
						className={cn(
							"absolute left-12 text-base duration-200",
							!isOpen && className
						)}
					>
						{item.title}
					</span>
				</a>
			))}
		</nav>
	);
}
