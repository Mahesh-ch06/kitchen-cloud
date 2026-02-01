import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChefHat, CheckCircle, XCircle, MoreVertical, 
  Star, Store, Mail, Phone, Shield, ShieldOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VendorWithProfile, useVerifyVendor } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animated-container';

interface VendorsTabProps {
  vendors: VendorWithProfile[] | undefined;
  isLoading: boolean;
}

export function VendorsTab({ vendors, isLoading }: VendorsTabProps) {
  const verifyMutation = useVerifyVendor();

  const handleVerify = async (vendorId: string, verified: boolean) => {
    try {
      await verifyMutation.mutateAsync({ vendorId, verified });
      toast.success(verified ? 'Vendor verified successfully' : 'Vendor verification revoked');
    } catch (error) {
      toast.error('Failed to update vendor status');
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

  if (!vendors || vendors.length === 0) {
    return (
      <FadeIn>
        <div className="text-center py-12">
          <Store className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vendors yet</h3>
          <p className="text-muted-foreground">Vendors will appear here once they register</p>
        </div>
      </FadeIn>
    );
  }

  const pendingVendors = vendors.filter(v => !v.is_verified);
  const verifiedVendors = vendors.filter(v => v.is_verified);

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {pendingVendors.length > 0 && (
        <FadeIn>
          <div className="rounded-2xl bg-warning/5 border border-warning/20 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-warning" />
              Pending Verification ({pendingVendors.length})
            </h3>
            <div className="space-y-3">
              {pendingVendors.map((vendor) => (
                <VendorRow 
                  key={vendor.id} 
                  vendor={vendor} 
                  onVerify={handleVerify}
                  isPending
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Verified Vendors */}
      <FadeIn delay={0.1}>
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Verified Vendors ({verifiedVendors.length})
          </h3>
          {verifiedVendors.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No verified vendors yet</p>
          ) : (
            <div className="space-y-3">
              {verifiedVendors.map((vendor) => (
                <VendorRow 
                  key={vendor.id} 
                  vendor={vendor} 
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

interface VendorRowProps {
  vendor: VendorWithProfile;
  onVerify: (vendorId: string, verified: boolean) => void;
  isPending?: boolean;
}

function VendorRow({ vendor, onVerify, isPending }: VendorRowProps) {
  const fullName = [vendor.profile?.first_name, vendor.profile?.last_name]
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
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <ChefHat className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{vendor.business_name}</h4>
            {vendor.is_verified && (
              <CheckCircle className="w-4 h-4 text-success" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{fullName}</p>
          <div className="flex items-center gap-4 mt-1">
            {vendor.profile?.email && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {vendor.profile.email}
              </span>
            )}
            {vendor.license_number && (
              <span className="text-xs text-muted-foreground">
                License: {vendor.license_number}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-1 justify-end">
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="font-medium">{vendor.rating || 'N/A'}</span>
          </div>
          <p className="text-xs text-muted-foreground">{vendor.stores_count} stores</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {vendor.is_verified ? (
              <DropdownMenuItem 
                onClick={() => onVerify(vendor.id, false)}
                className="text-destructive"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Revoke Verification
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem 
                onClick={() => onVerify(vendor.id, true)}
                className="text-success"
              >
                <Shield className="w-4 h-4 mr-2" />
                Verify Vendor
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
