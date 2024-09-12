"use client";
import { CreateNewRoom } from "./create-room";
import { SearchRoom } from "./search-and-join-room";

export function JoinRoom() {
	return (
		<>
			<SearchRoom />
			<CreateNewRoom />
		</>
	);
}

// <div className="w-1/3 flex items-end justify-end gap-3 pr-8">
// </div>
