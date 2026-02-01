import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface MobileNavProps {
  links: NavLink[];
  ctaButton?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  };
  secondaryButton?: {
    label: string;
    href: string;
  };
}

export function MobileNav({ links, ctaButton, secondaryButton }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-50"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={closeMenu}
            />

            {/* Slide-out Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[280px] bg-card border-l border-border shadow-2xl z-[60] flex flex-col"
            >
              {/* Close button area */}
              <div className="flex justify-end p-4 bg-transparent">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 px-4 py-4 bg-muted rounded-xl mx-4 my-2 border border-border">
                <ul className="space-y-2">
                  {links.map((link, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {link.isExternal ? (
                        <motion.a
                          href={link.href}
                          onClick={closeMenu}
                          className="block py-3 px-4 rounded-lg text-foreground font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                          whileHover={{ x: 6, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          {link.label}
                        </motion.a>
                      ) : (
                        <Link
                          to={link.href}
                          onClick={closeMenu}
                          className="block"
                        >
                          <motion.div
                            className="py-3 px-4 rounded-lg text-foreground font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                            whileHover={{ x: 6, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          >
                            {link.label}
                          </motion.div>
                        </Link>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Action Buttons */}
              <div className="p-4 mx-4 mb-4 flex flex-col gap-3 bg-muted rounded-xl border border-border">
                {secondaryButton && (
                  <Link to={secondaryButton.href} onClick={closeMenu} className="block w-full">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Button variant="outline" className="w-full font-medium transition-all duration-200 hover:shadow-md">
                        {secondaryButton.label}
                      </Button>
                    </motion.div>
                  </Link>
                )}
                {ctaButton && (
                  <Link to={ctaButton.href} onClick={closeMenu} className="block w-full">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <Button className="w-full font-semibold gap-2 transition-all duration-200 hover:shadow-glow">
                        {ctaButton.icon}
                        {ctaButton.label}
                      </Button>
                    </motion.div>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
