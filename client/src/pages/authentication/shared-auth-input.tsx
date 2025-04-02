import { z } from "zod";
import { FormControl } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { RegisterFormSchemaValidation, LoginFormSchemaValidation } from "./validation";
import { Button } from "../../components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useRef, useState } from "react";
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
	const inputRef = useRef<HTMLInputElement>(null);
	let type = fd.type;
	if (type === "password" && showPassword) {
		type = "text";
	}

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
		if (inputRef.current) {
			// focus on the input element when toggling password visibility
			inputRef.current.focus();
		}
	};

	return (
		<FormControl>
			<div className="flex flex-row">
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
