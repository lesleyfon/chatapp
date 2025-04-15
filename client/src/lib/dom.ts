

/**
 * The scrollToBottom function scrolls the last child element of a container into view.
 * @param lastElemRef - The `lastElemRef` parameter is a React mutable ref object that is used to
 * reference the last element in a container. This function `scrollToBottom` is designed to scroll the
 * last element into view within a container when called.
 */
export const scrollToBottom = (lastElemRef: React.MutableRefObject<null>) => {
  if (lastElemRef.current) {
    const messageSectionContainerRef = lastElemRef.current as HTMLElement;
    const lastChild = messageSectionContainerRef.lastElementChild;

    if (lastChild !== null) {
      lastChild?.scrollIntoView({ behavior: "smooth" });
    }
  }
};

