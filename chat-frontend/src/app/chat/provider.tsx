//src/app/Providers.tsx
'use client';
import { ResponsiveProvider } from './Responsive/contextResponsive';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ResponsiveProvider>
      {children}
    </ResponsiveProvider>
  );
}