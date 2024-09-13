import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "../../../api/httpMethods";
import { Button } from "../../../components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormRootError,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { useNavigate } from "react-router";

const FormSchema = z.object({
	email: z.string().email("Invalid Email").min(2, {
		message: "Username must be at least 2 characters.",
	}),
	password: z.string().min(6, {
		message: "Password must be of length 6 or greater",
	}),
});

export function Login() {
	const navigate = useNavigate();
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});
	const { setError } = form;
	async function onSubmit(data: z.infer<typeof FormSchema>) {
		const response = await api.login(data);
		const parseResponse = JSON.parse(response as string);

		if ("code" in parseResponse) {
			return setError("root", {
				message: parseResponse.message,
				type: "custom",
			});
		}

		localStorage.setItem("auth_token", parseResponse.token);
		localStorage.setItem("userId", parseResponse.user.userId);
		navigate("/chats");
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<>
								<FormLabel className="text-left w-full flex">Email</FormLabel>
								<FormControl>
									<Input placeholder="Email" {...field} />
								</FormControl>
								<FormMessage />
							</>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<>
								<FormLabel className="text-left w-full flex">Password</FormLabel>
								<FormControl>
									<Input placeholder="password" type="password" {...field} />
								</FormControl>
								<FormMessage />
							</>
						</FormItem>
					)}
				/>
				<FormRootError className=" text-red-300 text-left" />
				<Button type="submit" className="bg-white text-black rounded-[0.2rem]">
					Submit
				</Button>
			</form>
		</Form>
	);
}
