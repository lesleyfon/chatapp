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