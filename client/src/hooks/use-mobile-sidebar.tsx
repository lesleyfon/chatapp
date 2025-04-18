import { useCallback } from 'react';

import { useSidebar } from '../components/ui/sidebar';

export function useMobileSidebar() {
  const { isMobile, setOpenMobile, open } = useSidebar();

  const handleCloseDialogOnMobileView = useCallback(() => {
    if (isMobile) {
      setOpenMobile(!open);
    }
  }, [isMobile, open, setOpenMobile]);

  return { handleCloseDialogOnMobileView };
}
