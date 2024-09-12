import { ReactNode, type FC } from "react";
import { type NavigateFunction, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { LogOutIcon } from "lucide-react";

export const LogoutButton: FC = (): ReactNode => {
	const navigate: NavigateFunction = useNavigate();

	const logoutHandler = (): void => {
		localStorage.removeItem("auth_token");
		navigate("/");
	};
	return (
		<Button
			size="icon"
			role="combobox"
			variant="outline"
			className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f] rounded-[10%]"
			onClick={logoutHandler}
		>
			<LogOutIcon className="h-5 w-5" />
			<span className="sr-only">Logout</span>
		</Button>
	);
};
