import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Phone, Mail, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CustomerBottomNav } from '@/components/CustomerBottomNav';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  { id: '1', question: 'How do I track my order?', answer: 'You can track your order in real-time from the Orders page. Click on any active order to see live tracking with driver location and estimated delivery time.', category: 'Orders' },
  { id: '2', question: 'How can I cancel my order?', answer: 'You can cancel your order within 2 minutes of placing it. Go to Orders, select the order, and tap "Cancel Order". After 2 minutes, the restaurant may have already started preparing your food.', category: 'Orders' },
  { id: '3', question: 'What payment methods are accepted?', answer: 'We accept all major credit/debit cards, Apple Pay, Google Pay, and cash on delivery. You can manage your payment methods in the Profile section.', category: 'Payments' },
  { id: '4', question: 'How do I apply a promo code?', answer: 'On the checkout page, you\'ll see a "Apply Promo Code" field. Enter your code there and tap Apply. The discount will be reflected in your order total.', category: 'Payments' },
  { id: '5', question: 'How do I report an issue with my order?', answer: 'Go to Orders, select the order with the issue, and tap "Report Issue". You can describe the problem and attach photos if needed. Our support team will respond within 24 hours.', category: 'Support' },
];

const contactOptions = [
  { icon: MessageCircle, label: 'Live Chat', description: 'Chat with our support team', action: 'chat' },
  { icon: Phone, label: 'Call Us', description: '+1 (800) 123-4567', action: 'call' },
  { icon: Mail, label: 'Email', description: 'support@cloudkitchen.com', action: 'email' },
];

export function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-lg font-semibold">Help & Support</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Search */}
        <FadeIn>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </FadeIn>

        {/* Contact Options */}
        <FadeIn delay={0.1}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Us</h2>
        </FadeIn>
        <FadeInStagger className="grid grid-cols-3 gap-3 mb-8" staggerDelay={0.05}>
          {contactOptions.map((option) => {
            const Icon = option.icon;
            return (
              <FadeInStaggerItem key={option.action}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </motion.button>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>

        {/* FAQs */}
        <FadeIn delay={0.2}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Frequently Asked Questions
          </h2>
        </FadeIn>
        <FadeInStagger className="space-y-2" staggerDelay={0.03}>
          {filteredFaqs.map((faq) => (
            <FadeInStaggerItem key={faq.id}>
              <motion.div
                className="rounded-xl bg-card border border-border/50 overflow-hidden"
              >
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-[10px] text-primary font-medium uppercase">{faq.category}</span>
                    <h3 className="font-medium text-sm mt-0.5">{faq.question}</h3>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedFaq === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </motion.button>
                <motion.div
                  initial={false}
                  animate={{ 
                    height: expandedFaq === faq.id ? 'auto' : 0,
                    opacity: expandedFaq === faq.id ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-muted-foreground">
                    {faq.answer}
                  </p>
                </motion.div>
              </motion.div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>

      <CustomerBottomNav />
    </div>
  );
}
