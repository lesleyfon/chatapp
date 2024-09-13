import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

import { Login } from "./login/Login";
import { Register } from "./registration/Registration";
import "./style.css";

export default function Authentication() {
	return (
		<div className="container h-screen w-screen flex justify-center items-center">
			<div className="authentication-screen h-72">
				<Tabs defaultValue="login" className="w-[560px]">
					<TabsList className="grid grid-cols-2 w-full gap-8 mb-8 border-solid border-gray-100 h-fit border rounded  m-0 p-2 border-[solid] text-[#a1a1aa]">
						<TabsTrigger value="login" className="transition ease-in-out">
							Login
						</TabsTrigger>
						<TabsTrigger value="register" className="transition ease-in-out">
							Register
						</TabsTrigger>
					</TabsList>
					<TabsContent value="login" className="flex items-center justify-center w-full">
						<Login />
					</TabsContent>
					<TabsContent
						value="register"
						className="flex items-center justify-center w-full "
					>
						<Register />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
