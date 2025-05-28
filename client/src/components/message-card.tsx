import { cn, formatDate } from '../lib';
import type { MessageCardType } from '../types';
import ImageCard from './image-card';
import { Card, CardContent } from './ui/card';

export default function MessageCard({
  image_name,
  image_url,
  isSender,
  message_text,
  user_name,
  sent_at,
  timezone,
}: MessageCardType) {
  const hasImage = image_url && image_name;
  const hasText = message_text && message_text.length > 0;
  return (
    <div className='flex flex-col'>
      {hasText ? (
        <div
          className={cn(
            'flex py-4 ',
            isSender ? 'justify-end' : 'justify-start',
            hasImage ? 'pb-0' : 'pb-4',
          )}
        >
          <Card
            className={cn(
              'max-w-[70%] md:max-w-[60%] lg:max-w-[50%]',
              isSender ? 'bg-slate-300 text-black' : '!bg-[#242424]',
            )}
          >
            <CardContent className='p-3'>
              <div
                className={cn(
                  'text-sm font-semibold mb-1',
                  isSender ? 'text-primary-foreground' : 'text-secondary-foreground',
                )}
              >
                {user_name}
              </div>
              <p>{message_text}</p>
              <div className='text-[10px] text-muted-foreground mt-1'>
                {formatDate(sent_at, timezone)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {hasImage ? (
        <ImageCard imageUrl={image_url} imageName={image_name as string} isSender={isSender} />
      ) : null}
    </div>
  );
}
