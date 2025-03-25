import EmojiPicker, { Theme } from "emoji-picker-react";
import { SendIcon, SmileIcon } from "lucide-react";
import { Button } from "../../ui/button";

import { SubmitHandler, useForm } from "react-hook-form";
import { useSendMessage } from "../../../hooks/useSendMessage";
import { useSocket } from "../../../hooks/useSocket";
import { cn } from "../../../lib/utils";
import { type MessageInput } from "../../../types";
import { Input } from "../../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";

interface ChatInputProps {
  chatId: string;
  chatName: string;
  isPrivateChat?: boolean;
}
// BUTON Background Image
const svgUrl =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtcGFwZXJjbGlwIj48cGF0aCBkPSJNMTMuMjM0IDIwLjI1MiAyMSAxMi4zIi8+PHBhdGggZD0ibTE2IDYtOC40MTQgOC41ODZhMiAyIDAgMCAwIDAgMi44MjggMiAyIDAgMCAwIDIuODI4IDBsOC40MTQtOC41ODZhNCA0IDAgMCAwIDAtNS42NTYgNCA0IDAgMCAwLTUuNjU2IDBsLTguNDE1IDguNTg1YTYgNiAwIDEgMCA4LjQ4NiA4LjQ4NiIvPjwvc3ZnPg==";

export function MessageInput({
  chatId,
  chatName,
  isPrivateChat,
}: ChatInputProps) {
  const socket = useSocket();
  const { sendMessage, sendPrivateMessage } = useSendMessage({ socket });

  const INPUT_NAME = "message_text";
  const FILE_INPUT_NAME = "message_img";

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<MessageInput>();

  const onSubmit: SubmitHandler<MessageInput> = (data) => {
    if (data.message_text.trim().length === 0) {
      setError("message_text", {
        message: "Can't submit an empty field",
      });
      return;
    }
    const message_img = data?.message_img?.[0] as unknown as HTMLImageElement;

    if (isPrivateChat) {
      sendPrivateMessage(
        {
          message_text: data.message_text,
          recipientId: chatId,
          imageFile: message_img,
          imageName: message_img?.name,
        },
        socket,
      );
    } else {
      sendMessage(
        {
          chatId,
          message_text: data.message_text,
          chatName,
        },
        socket,
      );
    }
    setValue(INPUT_NAME, "");
  };

  return (
    <div className="p-4 border-t">
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mr-2 cursor-pointer"
          style={{
            backgroundImage: `url(${svgUrl})`,
            backgroundRepeat: "no-repeat",
            backgroundPositionX: "0",
            backgroundSize: "24px",
            backgroundPosition: "center",
          }}
        >
          <Input
            {...register(FILE_INPUT_NAME)}
            id="message-img"
            type="file"
            accept="image/png, image/jpeg"
            className=" cursor-pointer opacity-0"
          />
        </Button>
        <Input
          {...register(INPUT_NAME)}
          type="text"
          className={cn(
            "flex-1 ",
            errors?.message_text ? "border-red-400" : "",
          )}
          placeholder="Type a message..."
          autoComplete="off"
        />
        <Popover>
          <PopoverTrigger>
            <Button type="button" variant="ghost" size="icon" className="ml-2">
              <SmileIcon className="h-5 w-5" />
              <span className="sr-only">Add emoji</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="border-0 p-0 mr-5">
            <EmojiPicker
              width={300}
              theme={Theme.DARK}
              searchPlaceholder="Search Emoji..."
              onEmojiClick={({ emoji }) => {
                const currentMessageValue = getValues(INPUT_NAME);
                const messageWithEmojiAttached = `${currentMessageValue}${emoji}`;

                setValue(INPUT_NAME, messageWithEmojiAttached);
              }}
            />
          </PopoverContent>
        </Popover>
        <Button type="submit" size="icon" className="ml-2">
          <SendIcon className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
}
