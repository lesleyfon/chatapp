import { useQuery } from '@tanstack/react-query';
import { type MouseEvent, cloneElement, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import api from '../../api/http-methods';
import type { ChatUserType, CustomDialogTriggerProps, SearchPrivateRoomProps } from '../../types';
import { SearchIcon } from '../ui/avatar/index';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

function sortData(a: ChatUserType, b: ChatUserType) {
  const aLowercaseChatroomName = (a.name ?? '').toLowerCase();
  const bLowercaseChatroomName = (b.name ?? '').toLowerCase();
  return aLowercaseChatroomName > bLowercaseChatroomName ? 1 : -1;
}

const PrivateChatroomLinkItem = ({
  chatroomName,
  handleSelect,
}: {
  chatroomName: ChatUserType;
  handleSelect: () => void;
}) => {
  const { pk_user_id, name } = chatroomName;
  let { unique_chat_key } = chatroomName;
  if (!unique_chat_key) {
    unique_chat_key = `new_private_chat_${pk_user_id}`;
  }
  return (
    <Link to={`/private-chats/${unique_chat_key}`} key={pk_user_id}>
      <CommandItem
        value={pk_user_id}
        onSelect={handleSelect}
        className=' cursor-pointer !w-full hover:!bg-[#4c4c52] '
      >
        {name ?? ''}
      </CommandItem>
    </Link>
  );
};
const PrivateChatroomLinks = ({
  data,
  handleSelect,
}: {
  handleSelect: () => void;
  data: ChatUserType[];
}) => {
  if (data.length === 0) return null;
  return data
    .sort(sortData)
    .map((chatroomName) => (
      <PrivateChatroomLinkItem
        key={chatroomName.pk_user_id}
        handleSelect={handleSelect}
        chatroomName={chatroomName}
      />
    ));
};

function DialogTriggerButton({ triggerChild, openDialog }: CustomDialogTriggerProps) {
  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    openDialog();
  }

  if (!triggerChild) {
    return (
      <Button
        size='icon'
        role='combobox'
        variant='outline'
        className='border-0 p-0 bg-transparent  hover:bg-[#2f2f2f]'
        onClick={handleClick}
      >
        <SearchIcon className='h-5 w-5' />
        <span className='sr-only'>Search room</span>
      </Button>
    );
  }
  return cloneElement(triggerChild as React.ReactElement, {
    onClick: handleClick,
  });
}
export function SearchPrivateRoom({ triggerChild }: SearchPrivateRoomProps) {
  const [open, setOpen] = useState(false);
  const { register } = useForm();

  const SEARCH_INPUT_NAME: string = 'SEARCH_ROOM_NAME';

  const { data, isLoading, error } = useQuery<ChatUserType[], Error>({
    queryKey: ['private-rooms'],
    queryFn: () => api.fetchAllPrivateChatroom(),
  });

  function openDialog() {
    setOpen(true);
  }

  function handleSelect() {
    setOpen(false);
  }

  // Then in your JSX
  if (isLoading) {
    return <div className=' animate-bounce'>Loading...</div>;
  }

  if (error) {
    return <div className='text-red-500'>Error loading private rooms: {error.message}</div>;
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DialogTriggerButton triggerChild={triggerChild} openDialog={openDialog} />
      </DialogTrigger>
      <DialogContent
        className='sm:max-w-[475px] [&>button]:hidden bg-[#242424] p-6 border-0'
        role='dialog'
        aria-modal='true'
        aria-label='Search private rooms'
      >
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
          <DialogDescription>Search users to chat with</DialogDescription>
        </DialogHeader>
        <Command className='p-0 border'>
          <CommandInput
            {...register(SEARCH_INPUT_NAME, {
              onChange: () => openDialog(),
            })}
            placeholder='Search...'
            className='w-full'
          />
          <CommandList>
            <CommandEmpty>empty</CommandEmpty>
            <CommandGroup className=' flex !w-full [&>div]:!w-full'>
              {data?.length !== undefined && data.length > 0 ? (
                <PrivateChatroomLinks data={data} handleSelect={handleSelect} />
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
