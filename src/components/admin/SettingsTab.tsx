import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Bell, Shield, Palette, Globe, 
  CreditCard, Mail, Database, Save, 
  ChevronRight, ToggleLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { toast } from 'sonner';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const settingsSections: SettingsSection[] = [
  { id: 'general', title: 'General Settings', description: 'Platform name, logo, and basic configuration', icon: Settings },
  { id: 'notifications', title: 'Notifications', description: 'Email and push notification preferences', icon: Bell },
  { id: 'security', title: 'Security', description: 'Authentication and access control settings', icon: Shield },
  { id: 'appearance', title: 'Appearance', description: 'Theme and branding customization', icon: Palette },
  { id: 'payments', title: 'Payments', description: 'Payment gateways and commission settings', icon: CreditCard },
  { id: 'integrations', title: 'Integrations', description: 'Third-party service connections', icon: Globe },
];

export function SettingsTab() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    platformName: 'CloudKitchen',
    supportEmail: 'support@cloudkitchen.com',
    commissionRate: '15',
    minOrderAmount: '100',
    maxDeliveryRadius: '10',
    enableEmailNotifications: true,
    enablePushNotifications: true,
    enableSmsNotifications: false,
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  const renderSettingsContent = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrder">Minimum Order Amount (₹)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    value={settings.minOrderAmount}
                    onChange={(e) => setSettings({ ...settings, minOrderAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryRadius">Max Delivery Radius (km)</Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    value={settings.maxDeliveryRadius}
                    onChange={(e) => setSettings({ ...settings, maxDeliveryRadius: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable the platform for maintenance
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {[
              { key: 'enableEmailNotifications', label: 'Email Notifications', desc: 'Send email notifications for orders and updates' },
              { key: 'enablePushNotifications', label: 'Push Notifications', desc: 'Send push notifications to mobile apps' },
              { key: 'enableSmsNotifications', label: 'SMS Notifications', desc: 'Send SMS alerts for important updates' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={(settings as any)[item.key]}
                  onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                />
              </div>
            ))}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            {[
              { key: 'allowNewRegistrations', label: 'Allow New Registrations', desc: 'Allow new users to register on the platform' },
              { key: 'requireEmailVerification', label: 'Require Email Verification', desc: 'Users must verify email before accessing the platform' },
              { key: 'requirePhoneVerification', label: 'Require Phone Verification', desc: 'Users must verify phone number before ordering' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={(settings as any)[item.key]}
                  onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                />
              </div>
            ))}
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commission">Platform Commission Rate (%)</Label>
              <Input
                id="commission"
                type="number"
                value={settings.commissionRate}
                onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Percentage taken from each order as platform fee
              </p>
            </div>

            <div className="rounded-xl bg-secondary/50 border border-border p-6">
              <h4 className="font-medium mb-4">Payment Gateways</h4>
              <div className="space-y-3">
                {['Razorpay', 'Stripe', 'PayU'].map((gateway) => (
                  <div key={gateway} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <span className="font-medium">{gateway}</span>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-4">
            {[
              { name: 'Google Maps', status: 'Connected', desc: 'Location services and maps' },
              { name: 'Firebase', status: 'Not Connected', desc: 'Push notifications' },
              { name: 'Twilio', status: 'Not Connected', desc: 'SMS notifications' },
              { name: 'Mailgun', status: 'Connected', desc: 'Email delivery' },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">{integration.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    integration.status === 'Connected' 
                      ? 'bg-success/20 text-success' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {integration.status}
                  </span>
                  <Button variant="outline" size="sm">
                    {integration.status === 'Connected' ? 'Settings' : 'Connect'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-center py-12 text-muted-foreground">
            Select a section from the sidebar
          </div>
        );
    }
  };

  return (
    <FadeIn>
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Settings Sidebar */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <h3 className="font-semibold mb-4 px-2">Settings</h3>
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <motion.button
                key={section.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                <section.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{section.title}</p>
                  <p className={`text-xs truncate ${
                    activeSection === section.id 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {section.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-50" />
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                {settingsSections.find(s => s.id === activeSection)?.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
          
          {renderSettingsContent()}
        </div>
      </div>
    </FadeIn>
  );
}
