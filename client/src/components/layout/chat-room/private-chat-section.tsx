import { set } from "lodash";
import { useEffect, useRef, useState } from "react";
import { VList, VListHandle } from "virtua";

import { useSocket } from "../../../hooks/useSocket";
import { cn, formatDate } from "../../../lib/utils";
import useAuthStorage from "../../../store/useAuthStorage";
import { PrivateChatResultType } from "../../../types";
import { Card, CardContent } from "../../ui/card";
import { ScrollArea } from "../../ui/scroll-area";

export default function ImageCard({
  imageUrl,
  imageName,
  isSender,
}: {
  imageUrl: string;
  imageName: string;
  isSender: boolean;
}) {
  const imageType = imageName.split(".")[1];
  return (
    <div
      className={cn(
        "flex justify-end",
        isSender ? "justify-end" : "justify-start",
      )}
    >
      <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl dark:bg-gray-950 w-[400px] h-[250px]">
        <img
          src={`data:image/${imageType};base64,${imageUrl}`}
          alt={imageName}
          width={400}
          height={250}
          className="object-contain"
          style={{ aspectRatio: "400/250", objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

function ConversationCard({
  data,
  isSender,
}: {
  data: PrivateChatResultType;
  isSender: boolean;
}) {
  return (
    <>
      {data?.private_messages?.image_file ? (
        <ImageCard
          imageUrl={data?.private_messages?.image_file as string}
          imageName={data?.private_messages?.image_name as string}
          isSender={isSender}
        />
      ) : null}
      <div
        key={data?.private_messages.id}
        className={cn("flex py-4 ", isSender ? "justify-end" : "justify-start")}
      >
        <Card
          className={cn(
            "max-w-[70%]",
            isSender ? "bg-slate-300 text-black" : "",
          )}
        >
          <CardContent className="p-3">
            <div
              className={cn(
                "text-sm font-semibold mb-1",
                isSender
                  ? "text-primary-foreground"
                  : "text-secondary-foreground",
              )}
            >
              {data?.chat_user.name}
            </div>
            <p>{data?.private_messages?.message_text as string}</p>
            <div className="text-[10px] text-muted-foreground mt-1">
              {formatDate(data.private_messages.sent_at)}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export const PrivateMessageSection = ({
  data,
}: {
  data: PrivateChatResultType[];
}) => {
  const [allRoomMessages, setAllRoomMessages] = useState<
    PrivateChatResultType[]
  >([]);

  const vListRef = useRef<VListHandle>(null);
  const userId = useAuthStorage((state) => state.userId);

  useEffect(() => {
    if (!data?.length) {
      return;
    }
    setAllRoomMessages(data);
  }, [data]);

  // Restore scroll position after component is mounted and virtualized list has rendered
  useEffect(() => {
    const savedScrollPosition = localStorage.getItem("scrollPosition");
    if (savedScrollPosition && vListRef.current) {
      // Apply scroll position after list has rendered
      setTimeout(() => {
        if (vListRef.current) {
          vListRef.current.scrollToIndex(Number(savedScrollPosition), {
            smooth: true,
            align: "start",
          });
        }
      }, 100);
    }
  }, [allRoomMessages.length]); // Triggered after data is loaded

  const socket = useSocket();

  useEffect(() => {
    if (socket?.connected === false) socket?.connect();

    socket?.on(
      "add-private-message-response",
      (response: PrivateChatResultType) => {
        setAllRoomMessages((previousRoomMessages) => {
          if (String(response.chat_user.pk_user_id) === String(userId)) {
            set(response, "responseData?.chat_user?.pk_user_id", "You");
          }
          return [...previousRoomMessages, response];
        });
        if (vListRef.current) {
          // Scroll to bottom after new message is added
          vListRef.current.scrollToIndex(allRoomMessages.length, {
            smooth: true,
            align: "start",
          });
        }
      },
    );
    return () => {
      socket?.off("add-private-message-response");
    };
  }, [socket, userId, allRoomMessages]);

  const scrollAreaRef = useRef(null);
  const [scrollAreaHeight, setScrollAreaHeight] = useState(0);

  useEffect(() => {
    const setScrollArea = () => {
      if (scrollAreaRef.current) {
        const scrollArea = scrollAreaRef.current as HTMLElement;
        setScrollAreaHeight(scrollArea.clientHeight);
      }
    };

    if (scrollAreaRef.current) {
      setScrollArea();
    }
    if (typeof window === "undefined" || !scrollAreaRef?.current) {
      setScrollAreaHeight(800);
    }

    const controller = new AbortController();
    const signal = controller.signal;

    window.addEventListener("resize", setScrollArea, { signal });

    return () => {
      controller.abort();
    };
  }, [scrollAreaRef]);

  const handleScroll = (offset: number) => {
    localStorage.setItem("scrollPosition", offset.toString());
  };

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
      {allRoomMessages.length > 0 ? (
        <section>
          <VList
            style={{ height: scrollAreaHeight, flexDirection: "column" }}
            ref={vListRef}
            count={allRoomMessages.length}
            onScroll={handleScroll}
            shift={true}
          >
            {allRoomMessages.map((data) => {
              const isSender =
                data?.chat_user?.pk_user_id.toString() === String(userId);
              return (
                <ConversationCard
                  key={data?.private_messages.id}
                  data={data}
                  isSender={isSender}
                />
              );
            })}
          </VList>
        </section>
      ) : null}
    </ScrollArea>
  );
};
