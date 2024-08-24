import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

import { Login } from "./login/Login";
import { Register } from "./registration/Registration";

export default function Authentication() {
	return (
		<div className="container">
			<div className="authentication-screen">
				<Tabs defaultValue="login" className="w-[560px]">
					<TabsList>
						<TabsTrigger value="login">Login</TabsTrigger>
						<TabsTrigger value="register">Register</TabsTrigger>
					</TabsList>
					<TabsContent value="login" className="flex items-center justify-center">
						<Login />
					</TabsContent>
					<TabsContent value="register" className="flex items-center justify-center">
						<Register />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
