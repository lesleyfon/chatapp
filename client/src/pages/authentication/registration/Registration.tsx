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

export function Register() {
  const navigate = useNavigate();
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
        {REGISTRATION_FORM_INPUT_FIELDS.map((fd) => (
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
                  <Input {...field} {...fd} placeholder={fd.label} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormRootError className=" text-red-300 text-left" />
        <Button type="submit" className="bg-white text-black">
          Submit
        </Button>
      </form>
    </Form>
  );
}
