import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Bell, Globe, Shield, Smartphone, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';

interface SettingItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Moon;
  type: 'toggle' | 'link';
  value?: boolean;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    darkMode: false,
    notifications: true,
    emailUpdates: true,
    locationAccess: true,
  });

  const settingItems: SettingItem[] = [
    { id: 'darkMode', label: 'Dark Mode', description: 'Toggle dark theme', icon: settings.darkMode ? Moon : Sun, type: 'toggle' },
    { id: 'notifications', label: 'Push Notifications', description: 'Receive order updates', icon: Bell, type: 'toggle' },
    { id: 'emailUpdates', label: 'Email Updates', description: 'Promotional emails & offers', icon: Globe, type: 'toggle' },
    { id: 'locationAccess', label: 'Location Access', description: 'For delivery tracking', icon: Smartphone, type: 'toggle' },
  ];

  const linkItems = [
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Terms of Service', href: '/terms', icon: Globe },
  ];

  const toggleSetting = (id: string) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 px-4 h-14">
          <Link to="/profile">
            <motion.div whileTap={{ scale: 0.9 }}>
              <ArrowLeft className="w-6 h-6" />
            </motion.div>
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Toggle Settings */}
        <FadeIn>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Preferences</h2>
        </FadeIn>
        <FadeInStagger className="space-y-2 mb-8" staggerDelay={0.05}>
          {settingItems.map((item) => {
            const Icon = item.icon;
            return (
              <FadeInStaggerItem key={item.id}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{item.label}</h3>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[item.id]}
                    onCheckedChange={() => toggleSetting(item.id)}
                  />
                </div>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>

        {/* Link Settings */}
        <FadeIn delay={0.2}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Legal</h2>
        </FadeIn>
        <FadeInStagger className="space-y-2" staggerDelay={0.05}>
          {linkItems.map((item) => {
            const Icon = item.icon;
            return (
              <FadeInStaggerItem key={item.href}>
                <Link to={item.href}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-sm">{item.label}</h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </Link>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>

        {/* App Info */}
        <FadeIn delay={0.3}>
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">CloudKitchen v1.0.0</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">© 2024 CloudKitchen. All rights reserved.</p>
          </div>
        </FadeIn>
      </div>

      <CustomerBottomNav />
    </div>
  );
}
