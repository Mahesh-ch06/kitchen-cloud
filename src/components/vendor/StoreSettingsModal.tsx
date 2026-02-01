import { useState } from 'react';
import { Settings, Trash2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Tables<'stores'>;
}

export function StoreSettingsModal({ isOpen, onClose, store }: StoreSettingsModalProps) {
  const [isActive, setIsActive] = useState(store.is_active || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleToggleActive = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: checked })
        .eq('id', store.id);

      if (error) throw error;

      setIsActive(checked);
      queryClient.invalidateQueries({ queryKey: ['vendor-stores', user?.id] });
      toast.success(`Store ${checked ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update store status');
    }
  };

  const handleDeleteStore = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', store.id);

      if (error) throw error;

      toast.success('Store deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-stores', user?.id] });
      setShowDeleteDialog(false);
      onClose();
    } catch (error: any) {
      console.error('Error deleting store:', error);
      toast.error(error.message || 'Failed to delete store');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Settings className="w-5 h-5" />
              Store Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Store Name */}
            <div className="pb-4 border-b border-border">
              <h3 className="font-semibold text-lg">{store.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{store.address}</p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div>
                <Label htmlFor="active-toggle" className="text-sm font-semibold">
                  Store Active
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {isActive ? 'Customers can see and order from this store' : 'Store is hidden from customers'}
                </p>
              </div>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={handleToggleActive}
              />
            </div>

            {/* Store Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Rating</p>
                <p className="text-lg font-bold">{store.rating || 'New'} ⭐</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <p className="text-lg font-bold">{isActive ? '✓ Active' : '✗ Inactive'}</p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Danger Zone</span>
              </div>
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Store
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                This action cannot be undone. All menu items will be deleted.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{store.name}</strong>?
              <br />
              <br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All menu items</li>
                <li>Store settings</li>
                <li>Customer reviews</li>
              </ul>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStore}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Store'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
