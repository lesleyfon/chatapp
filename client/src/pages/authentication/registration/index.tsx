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
import { RegisterFormSchemaValidation } from "../validation";
import {
	REGISTRATION_FORM_INPUT_FIELDS,
	REGISTRATION_DEFAULT_VALUES,
} from "../../../components/constants";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function Register() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const authStorageLogin = useAuthStorage((state) => state.login);

	const form = useForm<z.infer<typeof RegisterFormSchemaValidation>>({
		resolver: zodResolver(RegisterFormSchemaValidation),
		defaultValues: REGISTRATION_DEFAULT_VALUES,
	});

	const { setError } = form;

	async function onSubmit(data: z.infer<typeof RegisterFormSchemaValidation>) {
		const response = await api.register(data);
		const parseResponse = JSON.parse(response as string);

		if ("code" in parseResponse) {
			return setError("root", {
				message: parseResponse.reason,
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
				{REGISTRATION_FORM_INPUT_FIELDS.map((fd) => {
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
													className="bg-white text-black"
													onClick={() => setShowPassword(!showPassword)}
												>
													{showPassword ? <EyeOff /> : <Eye />}
												</Button>
											)}
										</div>
									</FormControl>
									<FormMessage />
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
