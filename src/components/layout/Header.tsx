import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useQueue } from '@/context/QueueContext';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, WifiOff, Menu, X, Stethoscope, Pill } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/register', label: 'Register' },
  { href: '/queue', label: 'Queue' },
  { href: '/staff', label: 'Staff' },
  { href: '/doctor', label: 'Doctor' },
  { href: '/medicine', label: 'Medicine' },
];

export function Header() {
  const location = useLocation();
  const { state, toggleOffline } = useQueue();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">HealthQueue+</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === link.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Offline Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleOffline}
              className={cn(
                'hidden sm:flex gap-2',
                state.isOffline && 'text-warning'
              )}
            >
              {state.isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
