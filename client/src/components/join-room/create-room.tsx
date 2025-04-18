import { ErrorMessage } from '@hookform/error-message';
import { useMutation } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import api from '../../api/http-methods';
import { cn } from '../../lib';
import type { ChatResponse } from '../../types/index';
import { ERROR_FIELD_NAMES, INPUT_NAME } from '../constants';
import { PlusIcon, SendIcon } from '../ui/avatar/index';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';

export function CreateNewRoom() {
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: api.createNewRoomMutationFn,
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: { [key: string]: string }) => {
    mutation.mutate(data, {
      onSuccess: async function (data) {
        const response: Promise<ChatResponse> = await data.json();
        const result = await response;

        if (result.chats && result.chats.length > 0) {
          const roomId = result.chats[0].pk_chats_id;
          setOpenDialog(false);
          setValue(INPUT_NAME, '');
          navigate(`/chats/${roomId}`);
        }
      },
      onError: (error) => {
        setOpenDialog(true);

        const parsedError = JSON.parse(error.message as unknown as string);

        if (parsedError.error) {
          setError('new-chat-name-error', { message: parsedError.reason });
        } else {
          setError('new-chat-name-internal-error', {
            message: 'Internal Server Error: Please try again later.',
          });
        }
      },
    });
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild onClick={() => setOpenDialog(true)}>
        <Button
          size='icon'
          role='combobox'
          variant='outline'
          className='border-0 p-0 bg-transparent  hover:bg-[#2f2f2f] '
        >
          <PlusIcon className='h-5 w-5' />
          <span className='sr-only'>New Chat</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px] bg-[#242424] {'>
        <DialogHeader>
          <DialogTitle>Create a new Chatroom</DialogTitle>
          <DialogDescription>
            Create a new chatroom here. Click send button when you&lsquo;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            <Input
              type='text'
              className={cn('flex-1', errors?.['new-chat-name'] ? 'border-red-400' : '')}
              placeholder='Room name'
              autoComplete='off'
              {...register(INPUT_NAME, {
                required: "Can't submit an empty field",
                validate: (value) => {
                  const regex = /^\s*$/;
                  if (regex.test(value)) {
                    return "Room name can't be empty";
                  }
                  return true;
                },
                //Clear errors when input changes. This is to prevent errors from persisting when the user starts typing again.
                onChange: () => clearErrors(),
              })}
            />
            {ERROR_FIELD_NAMES.map((errorName) => (
              <Fragment key={errorName}>
                <ErrorMessage
                  errors={errors}
                  name={errorName}
                  render={({ message }) => <p className='text-xs text-red-400'>{message}</p>}
                />
              </Fragment>
            ))}
          </div>
          <DialogFooter>
            <div className='flex justify-end'>
              <Button
                type='submit'
                size='icon'
                className={cn('ml-2 hover:border-primary hover:border-solid')}
              >
                <SendIcon className='h-5 w-5' />
                <span className='sr-only'>Send message</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
