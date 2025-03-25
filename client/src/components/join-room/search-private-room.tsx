import { useQuery } from "@tanstack/react-query";
import { cloneElement, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import api from "../../api/http-methods";
import { ChatUserType } from "../../types";
import { SearchIcon } from "../ui/avatar/index";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface SearchPrivateRoomProps {
  triggerChild?: React.ReactNode;
}

interface CustomDialogTriggerProps {
  triggerChild?: React.ReactNode;
  openDialog: () => void;
}

function CustomDialogTrigger({
  triggerChild,
  openDialog,
}: CustomDialogTriggerProps) {
  if (!triggerChild) {
    return (
      <Button
        size="icon"
        role="combobox"
        variant="outline"
        className="border-0 p-0 bg-transparent  hover:bg-[#2f2f2f]"
        onClick={openDialog}
      >
        <SearchIcon className="h-5 w-5" />
        <span className="sr-only">Search room</span>
      </Button>
    );
  }
  return cloneElement(triggerChild as React.ReactElement, {
    onClick: openDialog,
  });
}
export function SearchPrivateRoom({ triggerChild }: SearchPrivateRoomProps) {
  const [open, setOpen] = useState(false);
  const { register } = useForm();

  const SEARCH_INPUT_NAME: string = "SEARCH_ROOM_NAME";

  const { data } = useQuery<ChatUserType[], Error>({
    queryKey: ["private-rooms"],
    queryFn: () => api.fetchAllPrivateChatroom(),
  });

  function openDialog() {
    setOpen(true);
  }

  function handleSelect() {
    setOpen(false);
  }

  const PrivateChatroomLinks = useMemo(() => {
    if (!data?.length) return [];
    return data
      .sort((a, b) => {
        const aLowercaseChatroomName = (a.name ?? "").toLowerCase();
        const bLowercaseChatroomName = (b.name ?? "").toLowerCase();
        return aLowercaseChatroomName > bLowercaseChatroomName ? 1 : -1;
      })
      .map((chatroomName) => (
        <Link
          to={`/private-chats/${chatroomName.pk_user_id}`}
          key={chatroomName.pk_user_id}
        >
          <CommandItem
            value={chatroomName.pk_user_id}
            onSelect={handleSelect}
            className=" cursor-pointer !w-full hover:!bg-[#4c4c52] "
          >
            {chatroomName.name ?? ""}
          </CommandItem>
        </Link>
      ));
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <CustomDialogTrigger
          triggerChild={triggerChild}
          openDialog={openDialog}
        />
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[475px] [&>button]:hidden bg-[#242424] p-6 border-0"
        role="dialog"
        aria-modal="true"
        aria-label="Search private rooms"
      >
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
          <DialogDescription>Search users to chat with</DialogDescription>
        </DialogHeader>
        <Command className="p-0 border">
          <CommandInput
            {...register(SEARCH_INPUT_NAME, {
              onChange: () => openDialog(),
            })}
            placeholder="Search..."
            className="w-full"
          />
          <CommandList>
            <CommandEmpty>empty</CommandEmpty>
            <CommandGroup className=" flex !w-full [&>div]:!w-full">
              {PrivateChatroomLinks}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
