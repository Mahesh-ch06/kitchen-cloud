import { motion } from 'framer-motion';
import { 
  Truck, CheckCircle, MoreVertical, Star, 
  Mail, Phone, Shield, ShieldOff, MapPin, Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeliveryPartnerWithProfile, useVerifyDeliveryPartner } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animated-container';

interface DeliveryPartnersTabProps {
  partners: DeliveryPartnerWithProfile[] | undefined;
  isLoading: boolean;
}

export function DeliveryPartnersTab({ partners, isLoading }: DeliveryPartnersTabProps) {
  const verifyMutation = useVerifyDeliveryPartner();

  const handleVerify = async (partnerId: string, verified: boolean) => {
    try {
      await verifyMutation.mutateAsync({ partnerId, verified });
      toast.success(verified ? 'Delivery partner verified successfully' : 'Verification revoked');
    } catch (error) {
      toast.error('Failed to update partner status');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!partners || partners.length === 0) {
    return (
      <FadeIn>
        <div className="text-center py-12">
          <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No delivery partners yet</h3>
          <p className="text-muted-foreground">Delivery partners will appear here once they register</p>
        </div>
      </FadeIn>
    );
  }

  const pendingPartners = partners.filter(p => !p.is_verified);
  const verifiedPartners = partners.filter(p => p.is_verified);

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingPartners.length > 0 && (
        <FadeIn>
          <div className="rounded-2xl bg-warning/5 border border-warning/20 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-warning" />
              Pending Verification ({pendingPartners.length})
            </h3>
            <div className="space-y-3">
              {pendingPartners.map((partner) => (
                <PartnerRow 
                  key={partner.id} 
                  partner={partner} 
                  onVerify={handleVerify}
                  isPending
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Verified Partners */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Verified Partners ({verifiedPartners.length})
          </h3>
          {verifiedPartners.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No verified partners yet</p>
          ) : (
            <div className="space-y-3">
              {verifiedPartners.map((partner) => (
                <PartnerRow 
                  key={partner.id} 
                  partner={partner} 
                  onVerify={handleVerify}
                />
              ))}
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

interface PartnerRowProps {
  partner: DeliveryPartnerWithProfile;
  onVerify: (partnerId: string, verified: boolean) => void;
  isPending?: boolean;
}

function PartnerRow({ partner, onVerify, isPending }: PartnerRowProps) {
  const fullName = [partner.profile?.first_name, partner.profile?.last_name]
    .filter(Boolean)
    .join(' ') || 'Unknown';

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
        isPending ? 'bg-warning/10 hover:bg-warning/15' : 'bg-secondary/30 hover:bg-secondary/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          partner.is_available ? 'bg-success/20' : 'bg-secondary'
        }`}>
          <Truck className={`w-6 h-6 ${partner.is_available ? 'text-success' : 'text-muted-foreground'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{fullName}</h4>
            {partner.is_verified && (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              partner.is_available 
                ? 'bg-success/20 text-success' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {partner.is_available ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            {partner.profile?.email && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {partner.profile.email}
              </span>
            )}
            {partner.vehicle_type && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Car className="w-3 h-3" />
                {partner.vehicle_type}
              </span>
            )}
            {partner.vehicle_number && (
              <span className="text-xs text-muted-foreground">
                {partner.vehicle_number}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-1 justify-end">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="font-medium">{partner.rating || 'N/A'}</span>
          </div>
          {partner.current_latitude && partner.current_longitude && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <MapPin className="w-3 h-3" />
              Location tracked
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {partner.is_verified ? (
              <DropdownMenuItem 
                onClick={() => onVerify(partner.id, false)}
                className="text-destructive"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Revoke Verification
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => onVerify(partner.id, true)}
                className="text-success"
              >
                <Shield className="w-4 h-4 mr-2" />
                Verify Partner
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
