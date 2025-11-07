//Src/app/chat/Responsive/useResponsive.ts
//Modulo para detectar si el dispositivo es movil o escritorio
'use client';
import { useEffect, useState } from 'react';
//Hook personalizado para detectar el tipo de dispositivo
export function useResponsive() {
    const [isMobile, setIsMobile] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const updateSize  = () => {
            const width = window.innerWidth;
            setIsMobile(width < 900);
            setIsTablet(width >= 900 && width < 1280);
            setIsDesktop(width >= 1280);
        };

       updateSize(); //Comprobar al montar
        window.addEventListener('resize', updateSize ); //Comprobar al redimensionar

        return () => window.removeEventListener('resize', updateSize );
    }, []);

    return { isMobile, isDesktop, isTablet };
}


