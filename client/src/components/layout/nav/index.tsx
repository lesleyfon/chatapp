import { ReactNode, useState } from "react";
import { JoinRoom } from "../../join-room";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../../api/http-methods";
import { LogoutButton } from "../../logout-button";
import { Menu, TriangleAlert } from "lucide-react";
import { Button } from "../../ui/button";
import { MobileSidebar } from "./mobile-nav";
import "./style.css";
import { useSidebar } from "../../ui/sidebar";
import { cva } from "class-variance-authority";

export function NavActions(): ReactNode {
  return (
    <div className="flex items-center justify-center h-full">
      <JoinRoom />
      <LogoutButton />
    </div>
  );
}

const navVariants = cva(
  "items-center justify-between bg-[#242424] shadow-md h-full w-full content-center flex-wrap px-6",
  {
    variants: {
      variant: {
        mobile: "flex md:hidden",
        desktop: "md:flex hidden",
      },
    },
  },
);

function MobileNav(): ReactNode {
  const [open, setOpen] = useState(false);
  const { setOpenMobile } = useSidebar();
  return (
    <>
      <nav className={navVariants({ variant: "mobile" })}>
        <Button
          className="p-0"
          onClick={() => {
            setOpen(true);
            setOpenMobile(true);
          }}
        >
          <Menu />
        </Button>
        <LogoutButton />
      </nav>
      <MobileSidebar open={open} setOpen={setOpen} />
    </>
  );
}

function Desktop({ roomName }: { roomName: string }): ReactNode {
  return (
    <nav className={navVariants({ variant: "desktop" })}>
      <div>
        <div className="font-semibold">{roomName}</div>
        <div className="text-xs text-muted-foreground">
          <span className="inline-flex bg-green-400 rounded-full w-2 h-2"></span>
          <span className="ml-1">Online</span>
        </div>
      </div>
      <NavActions />
    </nav>
  );
}

function Header(): ReactNode {
  const { chatId, recipientId } = useParams();

  const { isPending, data, isFetching } = useQuery({
    queryKey: [chatId], // Makes another call when chatId changes
    queryFn: chatId
      ? () => api.fetchChatListsDataFromChatId(chatId)
      : async () => null,
  });

  const {
    isPending: isRecipientPending,
    data: recipientData,
    isFetching: isRecipientFetching,
  } = useQuery({
    queryKey: [recipientId], // Makes another call when recipientId changes
    queryFn: recipientId
      ? () => api.fetchPrivateMessageListsDataFromRecipientId(recipientId)
      : async () => null,
  });

  if (
    (chatId && (isFetching || isPending)) ||
    (recipientId && (isRecipientFetching || isRecipientPending))
  ) {
    return <Desktop roomName="FETCHING DATA" />;
  }

  if (data?.error || (recipientData && "error" in recipientData)) {
    return (
      <>
        <MobileNav />
        <nav className={navVariants({ variant: "desktop" })}>
          <p className="flex items-center justify-center h-full text-red-500 text-2xl">
            Chat Room Not Found <TriangleAlert className="w-6 h-6" />
          </p>
          <NavActions />
        </nav>
      </>
    );
  }
  // Default Nav Name
  let userName = "Chat App";

  if (recipientData && "msg" in recipientData) {
    userName =
      recipientData.msg.find(
        (item) => Number(item.chat_user.pk_user_id) === Number(recipientId),
      )?.chat_user?.name ?? "Chat App";
  }
  const roomName = data?.msg?.[0]?.chats?.chat_name ?? userName;

  return (
    <header className="supports-backdrop-blur:bg-background/60 left-0 right-0 top-0 z-20 bg-background/95 backdrop-blur">
      <Desktop roomName={roomName} />
      <MobileNav />
    </header>
  );
}

export default Header;
