import EmojiPicker, { Theme } from 'emoji-picker-react';
import { ImageIcon, SendIcon, SmileIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { type FileError, useDropzone } from 'react-dropzone';
import { type SubmitErrorHandler, type SubmitHandler, useForm } from 'react-hook-form';

import { useSendMessage } from '../../../hooks/use-send-message';
import { useSocket } from '../../../hooks/use-socket';
import { cn, getCurrentDateTimeWithTimezone } from '../../../lib';
import type {
  ChatInputProps,
  ErrorMessagesProps,
  FileInputElementProps,
  MessageInputProps,
} from '../../../types';
import { ACCEPTED_IMAGE_TYPES, DEFAULT_SVG_URL, MAX_FILE_SIZE } from '../../constants';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

const ErrorMessages = ({ errors }: ErrorMessagesProps) => (
  <div className='flex flex-col'>
    {Object.keys(errors).map((error) => (
      <p key={error} className='text-red-400 text-xs'>
        {errors[error as keyof MessageInputProps]?.message as string}
      </p>
    ))}
  </div>
);

const FileInputElement = ({
  getRootProps,
  errors,
  svgUrl,
  isDragActive,
  getInputProps,
}: FileInputElementProps) => {
  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className={cn(
          'mr-2 cursor-pointer relative overflow-hidden',
          errors?.message_img && 'border-[1px] border-red-400',
          isDragActive && 'bg-gray-100 border-[1px] border-green-300',
        )}
      >
        {svgUrl === DEFAULT_SVG_URL ? (
          <ImageIcon className='h-5 w-5' />
        ) : (
          <div
            className='w-full h-full absolute inset-0'
            style={{
              backgroundImage: `url(${svgUrl})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
      </Button>
    </div>
  );
};

export function ChatMessageInput({
  chatId,
  chatName,
  isPrivateChat,
  uniqueChatKey,
}: ChatInputProps) {
  const [svgUrl, setSvgUrl] = useState(DEFAULT_SVG_URL);
  const socket = useSocket();
  const { sendMessage, sendPrivateMessage } = useSendMessage({ socket });

  const INPUT_NAME = 'message_text';
  const FILE_INPUT_NAME = 'message_img';

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<MessageInputProps>();

  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (svgUrl !== DEFAULT_SVG_URL) {
        URL.revokeObjectURL(svgUrl);
      }
    };
  }, [svgUrl]);

  const validateFile = (file: File): FileError | null => {
    const fileType = file.type;
    if (file.size > MAX_FILE_SIZE) {
      setError(FILE_INPUT_NAME, { message: 'File size is too large' });
      return { message: 'File size is too large', code: 'file-size-too-large' };
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(fileType)) {
      setError(FILE_INPUT_NAME, { message: 'File type is not supported' });
      return {
        message: 'File type is not supported',
        code: 'file-type-not-supported',
      };
    }
    return null;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === undefined || acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      if (file && !validateFile(file)) {
        setValue(FILE_INPUT_NAME, file as unknown as string);
        clearErrors(FILE_INPUT_NAME);
        const filePreview = URL.createObjectURL(file);
        setSvgUrl(filePreview);
      }
    },
    [setValue, clearErrors],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ACCEPTED_IMAGE_TYPES.split(',')
        .filter((type) => !type.includes('svg'))
        .map((type) => `.${type.split('/')[1]}`),
      'image/svg+xml': ['.svg'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    validator: validateFile,
  });

  const onSubmit: SubmitHandler<MessageInputProps> = (data) => {
    if (data.message_text.trim().length === 0) {
      setError('message_text', {
        message: "Can't submit an empty field",
      });
      return;
    }
    const message_img = getValues(FILE_INPUT_NAME) as unknown as File;
    if (isPrivateChat) {
      sendPrivateMessage(
        {
          message_text: data.message_text,
          recipientId: chatId,
          imageFile: message_img,
          imageName: message_img?.name,
          sent_at: getCurrentDateTimeWithTimezone(),
          uniqueChatKey: uniqueChatKey,
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
    // Clean up the file preview URL
    if (svgUrl !== DEFAULT_SVG_URL) {
      URL.revokeObjectURL(svgUrl);
    }
    setValue(INPUT_NAME, '');
    setSvgUrl(DEFAULT_SVG_URL);
    setValue(FILE_INPUT_NAME, undefined);
  };

  const onErrors: SubmitErrorHandler<MessageInputProps> = (errors) => {
    if ('message_img' in errors) {
      const message_img = getValues(FILE_INPUT_NAME) as unknown as File;
      if (!message_img || !validateFile(message_img)) {
        clearErrors(FILE_INPUT_NAME);
        handleSubmit(onSubmit)();
      }
    }
  };
  return (
    <div className={cn('p-4 border-t', isDragActive && 'bg-gray-100/10')}>
      <form onSubmit={handleSubmit(onSubmit, onErrors)} className='flex items-center'>
        <FileInputElement
          {...{
            getRootProps,
            errors,
            svgUrl,
            isDragActive,
            getInputProps,
          }}
        />

        <div className='flex flex-col w-full' {...getRootProps()}>
          <Input
            {...register(INPUT_NAME)}
            type='text'
            className={cn('flex-1', errors?.message_text ? 'border-red-400' : '')}
            placeholder='Type a message...'
            onClick={(e) => {
              // prevent opening file input since we are passing the getRootProps to the input wrapper
              e.stopPropagation();
            }}
          />
          <ErrorMessages errors={errors} />
        </div>

        <Popover>
          <PopoverTrigger>
            <Button type='button' variant='ghost' size='icon' className='ml-2'>
              <SmileIcon className='h-5 w-5' />
              <span className='sr-only'>Add emoji</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='border-0 p-0 mr-5'>
            <EmojiPicker
              width={300}
              theme={Theme.DARK}
              searchPlaceholder='Search Emoji...'
              onEmojiClick={({ emoji }) => {
                const currentMessageValue = getValues(INPUT_NAME);
                const messageWithEmojiAttached = `${currentMessageValue}${emoji}`;
                setValue(INPUT_NAME, messageWithEmojiAttached);
              }}
            />
          </PopoverContent>
        </Popover>
        <Button type='submit' size='icon' className='ml-2'>
          <SendIcon className='h-5 w-5' />
          <span className='sr-only'>Send message</span>
        </Button>
      </form>
    </div>
  );
}
