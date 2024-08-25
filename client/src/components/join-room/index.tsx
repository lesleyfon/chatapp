"use client";

import React from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import { PlusIcon } from "../ui/avatar/index";

const chatroomNames = [
	{
		value: "next.js",
		label: "Next.js",
	},
	{
		value: "sveltekit",
		label: "SvelteKit",
	},
	{
		value: "nuxt.js",
		label: "Nuxt.js",
	},
	{
		value: "remix",
		label: "Remix",
	},
	{
		value: "astro",
		label: "Astro",
	},
];

export function JoinRoom() {
	const [open, setOpen] = React.useState(false);
	const [value, setValue] = React.useState("");

	const handleSelect = (currentValue: string) => {
		setValue(currentValue === value ? "" : currentValue);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					size="icon"
					role="combobox"
					variant="outline"
					aria-expanded={open}
					className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f] rounded-[10%]"
				>
					<PlusIcon className="h-5 w-5" />
					<span className="sr-only">New Chat</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0 bg-[#242424] rounded-[0.2rem]">
				<Command>
					<CommandInput placeholder="Search framework..." />
					<CommandList>
						<CommandEmpty>No framework found.</CommandEmpty>
						<CommandGroup className=" flex !w-full [&>div]:!w-full ">
							{chatroomNames.map((chatroomName) => (
								<Link to={`/chats/${chatroomName.value}`}>
									<CommandItem
										key={chatroomName.value}
										value={chatroomName.value}
										onSelect={handleSelect}
										className=" cursor-pointer !w-full hover:!bg-[#4c4c52] !rounded-[0.2rem]"
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === chatroomName.value
													? "opacity-100"
													: "opacity-0"
											)}
										/>
										{chatroomName.label}
									</CommandItem>
								</Link>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
