import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, CheckCircle, XCircle, Clock, User, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@/components/ui/animated-container';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StoreRequest {
  id: string;
  vendor_id: string;
  current_limit: number;
  requested_limit: number;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  vendors: {
    business_name: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function StoreLimitRequestsTab() {
  const [selectedRequest, setSelectedRequest] = useState<StoreRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['store-limit-requests'],
    queryFn: async () => {
      // @ts-ignore - Type will be available after migration
      const { data, error } = await supabase
        .from('store_limit_requests')
        .select(`
          *,
          vendors!inner(business_name),
          profiles!inner(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any as StoreRequest[];
    },
  });

  const handleOpenDialog = (request: StoreRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      // @ts-ignore - Type will be available after migration
      const { error } = await supabase
        .from('store_limit_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes.trim() || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success(`Approved! Vendor can now create up to ${selectedRequest.requested_limit} stores`);
      queryClient.invalidateQueries({ queryKey: ['store-limit-requests'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      // @ts-ignore - Type will be available after migration
      const { error } = await supabase
        .from('store_limit_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes.trim(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['store-limit-requests'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/20 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const processedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <FadeIn>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Store Limit Requests</h2>
          <p className="text-sm text-muted-foreground">Review and approve vendor requests for additional stores</p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              Pending Requests
              <Badge variant="outline">{pendingRequests.length}</Badge>
            </h3>
            <FadeInStagger className="space-y-3" staggerDelay={0.05}>
              {pendingRequests.map((request) => (
                <FadeInStaggerItem key={request.id}>
                  <motion.div whileHover={{ x: 4 }}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenDialog(request)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Store className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{request.vendors.business_name}</h4>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <User className="w-4 h-4" />
                                <span>{request.profiles.first_name} {request.profiles.last_name}</span>
                                <span>•</span>
                                <span>{request.profiles.email}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm mb-3">
                                <span>Current: <strong>{request.current_limit} stores</strong></span>
                                <span>→</span>
                                <span className="text-primary font-semibold">Requested: {request.requested_limit} stores</span>
                                <span className="text-success">(+{request.requested_limit - request.current_limit})</span>
                              </div>
                              <div className="p-3 rounded-lg bg-secondary/50">
                                <p className="text-sm font-medium mb-1">Reason:</p>
                                <p className="text-sm text-muted-foreground">{request.reason}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Requested {format(new Date(request.created_at), 'PPp')}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Review</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              Processed Requests
              <Badge variant="secondary">{processedRequests.length}</Badge>
            </h3>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <Card key={request.id} className="opacity-70">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{request.vendors.business_name}</h4>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{request.current_limit} → {request.requested_limit} stores</span>
                            <span>•</span>
                            <span>{format(new Date(request.created_at), 'PP')}</span>
                          </div>
                          {request.admin_notes && (
                            <div className="mt-2 p-2 rounded bg-secondary/30 text-xs">
                              <strong>Admin:</strong> {request.admin_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!requests || requests.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold mb-2">No requests yet</h3>
              <p className="text-sm text-muted-foreground">Vendor store limit requests will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Store Limit Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.vendors.business_name} - {selectedRequest?.profiles.email}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground mb-1">Current Limit</p>
                  <p className="text-2xl font-bold">{selectedRequest.current_limit}</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Requested Limit</p>
                  <p className="text-2xl font-bold text-primary">{selectedRequest.requested_limit}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Vendor's Reason
                </p>
                <p className="text-sm">{selectedRequest.reason}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes {selectedRequest.status === 'pending' && '(optional)'}</label>
                <Textarea
                  placeholder="Add notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  disabled={isProcessing}
                />
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </FadeIn>
  );
}
