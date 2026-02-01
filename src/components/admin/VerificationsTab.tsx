import { motion } from 'framer-motion';
import { 
  Shield, Store, Truck, CheckCircle, XCircle, 
  Mail, Phone, MapPin, Calendar, User, FileText, Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  VendorWithProfile, 
  DeliveryPartnerWithProfile,
  useVerifyVendor,
  useVerifyDeliveryPartner
} from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';

interface VerificationsTabProps {
  vendors: VendorWithProfile[] | undefined;
  deliveryPartners: DeliveryPartnerWithProfile[] | undefined;
  isLoading: boolean;
}

export function VerificationsTab({ vendors, deliveryPartners, isLoading }: VerificationsTabProps) {
  const verifyVendorMutation = useVerifyVendor();
  const verifyPartnerMutation = useVerifyDeliveryPartner();

  const pendingVendors = vendors?.filter(v => !v.is_verified) || [];
  const pendingPartners = deliveryPartners?.filter(p => !p.is_verified) || [];
  const totalPending = pendingVendors.length + pendingPartners.length;

  const handleVerifyVendor = async (vendorId: string, verified: boolean) => {
    try {
      await verifyVendorMutation.mutateAsync({ vendorId, verified });
      toast.success(verified ? 'Vendor verified successfully' : 'Vendor rejected');
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  const handleVerifyPartner = async (partnerId: string, verified: boolean) => {
    try {
      await verifyPartnerMutation.mutateAsync({ partnerId, verified });
      toast.success(verified ? 'Delivery partner verified successfully' : 'Partner rejected');
    } catch (error) {
      toast.error('Failed to update partner status');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (totalPending === 0) {
    return (
      <FadeIn>
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No pending verifications at the moment. New vendors and delivery partners will appear here for approval.
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <FadeIn>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pending Verifications</h2>
                <p className="text-sm text-muted-foreground font-normal">
                  {totalPending} account{totalPending !== 1 ? 's' : ''} waiting for approval
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{pendingVendors.length}</p>
                  <p className="text-xs text-muted-foreground">Vendors</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50">
                <Truck className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{pendingPartners.length}</p>
                  <p className="text-xs text-muted-foreground">Delivery Partners</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Pending Vendors */}
      {pendingVendors.length > 0 && (
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                Vendor Verification Requests ({pendingVendors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FadeInStagger className="space-y-4" staggerDelay={0.05}>
                {pendingVendors.map((vendor) => (
                  <FadeInStaggerItem key={vendor.id}>
                    <VendorVerificationCard 
                      vendor={vendor}
                      onVerify={handleVerifyVendor}
                      isLoading={verifyVendorMutation.isPending}
                    />
                  </FadeInStaggerItem>
                ))}
              </FadeInStagger>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Pending Delivery Partners */}
      {pendingPartners.length > 0 && (
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                Delivery Partner Verification Requests ({pendingPartners.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FadeInStagger className="space-y-4" staggerDelay={0.05}>
                {pendingPartners.map((partner) => (
                  <FadeInStaggerItem key={partner.id}>
                    <PartnerVerificationCard 
                      partner={partner}
                      onVerify={handleVerifyPartner}
                      isLoading={verifyPartnerMutation.isPending}
                    />
                  </FadeInStaggerItem>
                ))}
              </FadeInStagger>
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}

// Vendor Verification Card
interface VendorVerificationCardProps {
  vendor: VendorWithProfile;
  onVerify: (vendorId: string, verified: boolean) => void;
  isLoading: boolean;
}

function VendorVerificationCard({ vendor, onVerify, isLoading }: VendorVerificationCardProps) {
  const fullName = [vendor.profile?.first_name, vendor.profile?.last_name]
    .filter(Boolean)
    .join(' ') || 'Unknown';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-5 rounded-xl border-2 border-warning/30 bg-warning/5 hover:bg-warning/10 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Store className="w-7 h-7 text-orange-500" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg">{fullName}</h4>
                <Badge variant="outline" className="border-warning text-warning">
                  Vendor
                </Badge>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {vendor.profile?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{vendor.profile.email}</span>
                  </div>
                )}
                {vendor.profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{vendor.profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Applied: {new Date(vendor.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>ID: {vendor.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-success hover:bg-success/90"
                onClick={() => onVerify(vendor.id, true)}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Vendor
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onVerify(vendor.id, false)}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Delivery Partner Verification Card
interface PartnerVerificationCardProps {
  partner: DeliveryPartnerWithProfile;
  onVerify: (partnerId: string, verified: boolean) => void;
  isLoading: boolean;
}

function PartnerVerificationCard({ partner, onVerify, isLoading }: PartnerVerificationCardProps) {
  const fullName = [partner.profile?.first_name, partner.profile?.last_name]
    .filter(Boolean)
    .join(' ') || 'Unknown';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="p-5 rounded-xl border-2 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Truck className="w-7 h-7 text-blue-500" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg">{fullName}</h4>
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Delivery Partner
                </Badge>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {partner.profile?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{partner.profile.email}</span>
                  </div>
                )}
                {partner.profile?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{partner.profile.phone}</span>
                  </div>
                )}
                {partner.vehicle_type && (
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    <span>Vehicle: {partner.vehicle_type}</span>
                  </div>
                )}
                {partner.vehicle_number && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Number: {partner.vehicle_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Applied: {new Date(partner.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-success hover:bg-success/90"
                onClick={() => onVerify(partner.id, true)}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Partner
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onVerify(partner.id, false)}
                disabled={isLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
