import { useCallback, useEffect, useState } from 'react';

export function useFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        function onChange() {
            setIsFullscreen(!!document.fullscreenElement);
        }
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggle = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    return { isFullscreen, toggle };
}
