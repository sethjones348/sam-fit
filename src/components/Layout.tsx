import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar - hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <Navbar />
      </div>
      
      {/* Mobile header - removed, using bottom nav only */}
      
      <main className="flex-grow pt-0 md:pt-20 pb-20 md:pb-0">
        {children}
      </main>
      
      {/* Footer - hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <Footer />
      </div>
      
      {/* Bottom navigation - shown on mobile, hidden on desktop */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

