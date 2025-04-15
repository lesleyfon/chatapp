import {User, Users, Plus } from "lucide-react";
import { RegisterFormSchemaValidation, LoginFormSchemaValidation } from "../pages/authentication/validation";
import { z } from "zod";

export const SIDEBAR_CONSTANTS = {
  MESSAGE_TEXT_MAX_WIDTH: "md:max-w-[110px]",
  HOVER_BG_COLOR: "hover:!bg-[#4c4c52]",
  ICON_MAP: {
    User,
    Users,
		Plus
  }
} as const;



export const REGISTRATION_FORM_INPUT_FIELDS: {
  name: keyof z.infer<typeof RegisterFormSchemaValidation>;
  label: string;
  type: string;
  autoComplete: string;
}[] = [
  { name: "name", label: "Full Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
];

export const LOGIN_FORM_INPUT_FIELDS: {
  name: keyof z.infer<typeof LoginFormSchemaValidation>;
  label: string;
  type: string;
  autoComplete: string;
}[] = [
  { name: "email", label: "Email", type: "email", autoComplete: "username" },
  { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
];


export const LOGIN_DEFAULT_VALUES = {
  email: "",
  password: "",
};

export const REGISTRATION_DEFAULT_VALUES = {
  name: "",
  email: "",
  password: "",
};


/**
 * @description - The input name for the new chat room.
 */
export const INPUT_NAME = "new-chat-name";

/**
 * @description - The error field names for the new chat room.
 */
export const ERROR_FIELD_NAMES = [INPUT_NAME, "new-chat-name-error", "new-chat-name-internal-error"];

export const DEFAULT_SVG_URL =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGFwZXJjbGlwIj48cGF0aCBkPSJNMTMuMjM0IDIwLjI1MiAyMSAxMi4zIi8+PHBhdGggZD0ibTE2IDYtOC40MTQgOC41ODZhMiAyIDAgMCAwIDAgMi44MjggMiAyIDAgMCAwIDIuODI4IDBsOC40MTQtOC41ODZhNCA0IDAgMCAwIDAtNS42NTYgNCA0IDAgMCAwLTUuNjU2IDBsLTguNDE1IDguNTg1YTYgNiAwIDEgMCA4LjQ4NiA4LjQ4NiIvPjwvc3ZnPg==";