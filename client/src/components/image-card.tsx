import { cn } from '../lib';
import { getImageSrc } from './layout/chat-room/private-chat-section';

export default function ImageCard({
  imageUrl,
  imageName,
  isSender,
}: {
  imageUrl: string;
  imageName: string;
  isSender: boolean;
}) {
  const src = getImageSrc(imageUrl, imageName);

  return (
    <div className={cn('flex justify-end', isSender ? 'justify-end' : 'justify-start')}>
      <div className='bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl dark:bg-gray-950 w-[400px] h-[250px]'>
        <img
          src={src}
          alt={imageName}
          width={400}
          height={250}
          className='object-contain'
          style={{ aspectRatio: '400/250', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
