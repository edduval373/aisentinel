import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, User, LogOut, Trash2, Plus, RotateCcw } from "lucide-react";
import { AccountManager } from "@/lib/accountManager";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedAccount {
  email: string;
  sessionToken: string;
  lastUsed: string;
  role: string;
  roleLevel: number;
  companyName?: string;
}

export default function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSavedAccounts();
    
    // Add event listener for storage changes (when another tab saves an account)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aisentinel_saved_accounts') {
        console.log('🔄 [ACCOUNT DROPDOWN] Storage changed, reloading accounts');
        loadSavedAccounts();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadSavedAccounts = () => {
    console.log('🔄 [ACCOUNT DROPDOWN] Loading saved accounts...');
    
    try {
      // Use AccountManager to safely get accounts
      const accounts = AccountManager.getSavedAccounts();
      console.log('🔄 [ACCOUNT DROPDOWN] Loaded accounts from AccountManager:', accounts?.length || 0);
      
      // Ensure accounts is always an array
      const safeAccounts = Array.isArray(accounts) ? accounts : [];
      setSavedAccounts(safeAccounts);
      
      console.log('🔄 [ACCOUNT DROPDOWN] Set saved accounts:', safeAccounts.length, 'accounts');
      
    } catch (error) {
      console.error('🔄 [ACCOUNT DROPDOWN] Error loading accounts:', error);
      // Always set to empty array on error to prevent undefined issues
      setSavedAccounts([]);
    }
  };

  const switchAccount = async (account: SavedAccount) => {
    try {
      console.log('🔄 [ACCOUNT SWITCH] Switching to:', account.email);
      
      // Show immediate feedback
      toast({
        title: "Switching Account",
        description: `Switching to ${account.email}...`,
      });
      
      // Close dropdown
      setIsOpen(false);
      
      // Set auth token for immediate API calls
      localStorage.setItem('authToken', account.sessionToken);
      localStorage.setItem('sessionToken', account.sessionToken);
      
      // Update last used timestamp
      AccountManager.updateLastUsed(account.email);
      
      // Force reload to apply session changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error selecting account:', error);
      toast({
        title: "Switch Failed",
        description: "Failed to switch account. Please try again.",
      });
    }
  };

  const deleteAccount = (email: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (user?.email === email) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the currently active account",
      });
      return;
    }
    
    // Open confirmation modal
    setAccountToDelete(email);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteAccount = () => {
    if (accountToDelete) {
      AccountManager.removeAccount(accountToDelete);
      loadSavedAccounts();
      
      toast({
        title: "Account Removed",
        description: `Removed ${accountToDelete} from saved accounts`,
      });
      
      setAccountToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('sessionToken');
    document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    
    // Reload to landing page
    window.location.reload();
  };

  const createNewSession = () => {
    console.log('🔄 [NEW SESSION] Redirecting to create new session');
    window.open('/create-production-session.html', '_blank');
  };

  if (!user) {
    return null;
  }

  const currentUserInitials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U';
  const hasMultipleAccounts = savedAccounts.length > 1;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          backgroundColor: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        <Avatar style={{ width: '32px', height: '32px' }}>
          <AvatarFallback style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {currentUserInitials}
          </AvatarFallback>
        </Avatar>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '13px', fontWeight: '500' }}>
            {user.email}
          </span>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>
            {user.role}
          </span>
        </div>
        <ChevronDown style={{ width: '16px', height: '16px', color: '#6b7280' }} />
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            minWidth: '280px',
            zIndex: 50
          }}
        >
          {/* Current Account */}
          <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar style={{ width: '24px', height: '24px' }}>
                <AvatarFallback style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {currentUserInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  {user.email}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Current Account
                </div>
              </div>
            </div>
          </div>

          {/* Other Saved Accounts */}
          {hasMultipleAccounts && (
            <div style={{ padding: '8px 0' }}>
              <div style={{ padding: '0 12px 8px 12px', fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                Switch Account
              </div>
              {savedAccounts.filter(account => account.email !== user.email).map((account) => (
                <button
                  key={account.email}
                  onClick={() => switchAccount(account)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#374151',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Avatar style={{ width: '20px', height: '20px' }}>
                    <AvatarFallback style={{
                      backgroundColor: '#6366f1',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: '600'
                    }}>
                      {account.email.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{account.email}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{account.role}</div>
                  </div>
                  <button
                    onClick={(e) => deleteAccount(account.email, e)}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      color: '#ef4444'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 style={{ width: '12px', height: '12px' }} />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={createNewSession}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#374151',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Plus style={{ width: '16px', height: '16px', color: '#10b981' }} />
              Add New Account
            </button>
            
            <button
              onClick={logout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#ef4444',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef2f2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog - Remove Tailwind variant */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {accountToDelete} from your saved accounts? 
              This will not delete the actual account, only remove it from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAccount}
              style={{
                backgroundColor: '#ef4444',
                color: 'white'
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Click outside to close */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}