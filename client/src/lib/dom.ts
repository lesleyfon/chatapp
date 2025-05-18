/**
 * The scrollToBottom function scrolls the last child element of a container into view.
 * @param lastElemRef - The `lastElemRef` parameter is a React mutable ref object that is used to
 * reference the last element in a container. This function `scrollToBottom` is designed to scroll the
 * last element into view within a container when called.
 */
export function scrollToBottom(lastElemRef: React.MutableRefObject<null>) {
  if (lastElemRef.current) {
    const messageSectionContainerRef = lastElemRef.current as HTMLElement;
    const lastChild = messageSectionContainerRef.lastElementChild;

    if (lastChild !== null) {
      lastChild.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

/**
 * The function `getImageSrc` checks if an image URL starts with "blob:" or "https://" and returns it
 * as is, otherwise it constructs a data URL from the image URL and image name.
 * @param imageUrl - The `imageUrl` parameter is a string that represents the URL of an image.
 * @param imageName - The `imageName` parameter is a string that represents the name of an image.
 * @returns The function `getImageSrc` returns a string that represents the source of an image.
 */
export function getImageSrc(imageUrl: string, imageName?: string): string {
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Fall back for images uploaded before migration
  const imageNameParts = imageName?.split('.');
  const imageType =
    imageNameParts?.length !== undefined && imageNameParts.length > 0
      ? imageNameParts.pop()
      : 'jpeg';
  return `data:image/${imageType};base64,${imageUrl}`;
}
