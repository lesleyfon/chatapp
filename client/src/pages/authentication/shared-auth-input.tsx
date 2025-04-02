import { z } from "zod";
import { FormControl } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { RegisterFormSchemaValidation, LoginFormSchemaValidation } from "./validation";
import { Button } from "../../components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ControllerRenderProps } from "react-hook-form";
type FormSchema = z.infer<typeof RegisterFormSchemaValidation | typeof LoginFormSchemaValidation>;
type NameType =
	| keyof z.infer<typeof RegisterFormSchemaValidation>
	| keyof z.infer<typeof LoginFormSchemaValidation>;
type Field = ControllerRenderProps<FormSchema>;

interface SharedAuthInputProps {
	field: Field; // Replace with proper type
	fd: {
		name: NameType;
		label: string;
		type: string;
		autoComplete: string;
	};
}

export function SharedAuthInput({ field, fd }: SharedAuthInputProps) {
	const [showPassword, setShowPassword] = useState(false);
	let type = fd.type;
	if (type === "password" && showPassword) {
		type = "text";
	}

	return (
		<FormControl>
			<div className="flex flex-row">
				<Input {...field} {...fd} placeholder={fd.label} type={type} />
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
	);
}
