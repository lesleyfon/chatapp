import { z } from "zod";
import { FormControl } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { RegisterFormSchemaValidation, LoginFormSchemaValidation } from "./validation";
import { Button } from "../../components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import { ControllerRenderProps } from "react-hook-form";
type FormSchema = z.infer<typeof RegisterFormSchemaValidation | typeof LoginFormSchemaValidation>;
type NameType =
	| keyof z.infer<typeof RegisterFormSchemaValidation>
	| keyof z.infer<typeof LoginFormSchemaValidation>;
type Field = ControllerRenderProps<FormSchema>;

interface SharedAuthInputProps {
	field: Field;
	fd: {
		name: NameType;
		label: string;
		type: string;
		autoComplete: string;
	};
}

export function SharedAuthInput({ field, fd }: SharedAuthInputProps) {
	const [showPassword, setShowPassword] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	let type = fd.type;
	if (type === "password" && showPassword) {
		type = "text";
	}

	const togglePasswordVisibility = useCallback(() => {
		setShowPassword(!showPassword);
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, [showPassword]);

	return (
		<FormControl>
			<div className="flex flex-row relative items-center">
				<Input {...field} {...fd} ref={inputRef} placeholder={fd.label} type={type} />
				{fd.type === "password" && (
					<Button
						type="button"
						className="bg-white text-black"
						onClick={togglePasswordVisibility}
						aria-label={showPassword ? "Hide password" : "Show password"}
						aria-pressed={showPassword}
					>
						{showPassword ? <EyeOff /> : <Eye />}
					</Button>
				)}
			</div>
		</FormControl>
	);
}
