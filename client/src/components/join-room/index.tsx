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
