import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "../../../api/http-methods";
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
import useAuthStorage from "../../../store/useAuthStorage";
import { LoginFormSchemaValidation } from "../validation";
import { LOGIN_FORM_INPUT_FIELDS, LOGIN_DEFAULT_VALUES } from "../../../components/constants";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function Login() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const authStorageLogin = useAuthStorage((state) => state.login);
	const form = useForm<z.infer<typeof LoginFormSchemaValidation>>({
		resolver: zodResolver(LoginFormSchemaValidation),
		defaultValues: LOGIN_DEFAULT_VALUES,
	});
	const { setError } = form;
	async function onSubmit(data: z.infer<typeof LoginFormSchemaValidation>) {
		const response = await api.login(data);
		const parseResponse = JSON.parse(response as string);

		if ("code" in parseResponse) {
			return setError("root", {
				message: parseResponse.message,
				type: "custom",
			});
		}

		authStorageLogin({
			userId: parseResponse.user.userId,
			token: parseResponse.token,
		});

		navigate("/chats");
	}
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
				{LOGIN_FORM_INPUT_FIELDS.map((fd) => {
					let type = fd.type;
					if (type === "password" && showPassword) {
						type = "text";
					}

					return (
						<FormField
							key={fd.name}
							control={form.control}
							name={fd.name}
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-left w-full flex">
										{fd.label}
									</FormLabel>
									<FormControl>
										<div className="flex flex-row">
											<Input
												{...field}
												{...fd}
												placeholder={fd.label}
												type={type}
											/>
											{fd.type === "password" && (
												<Button
													type="button"
													role="button"
													className="bg-white text-black"
													aria-label={
														showPassword
															? "Hide password"
															: "Show password"
													}
													onClick={() => setShowPassword(!showPassword)}
												>
													{showPassword ? <EyeOff /> : <Eye />}
												</Button>
											)}
										</div>
									</FormControl>
									<FormMessage className=" text-red-300 text-left" />
								</FormItem>
							)}
						/>
					);
				})}
				<FormRootError className=" text-red-300 text-left" />
				<Button type="submit" className="bg-white text-black">
					Submit
				</Button>
			</form>
		</Form>
	);
}
