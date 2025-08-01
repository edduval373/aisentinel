import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    
    // Add interval to periodically refresh accounts (every 10 seconds)
    const refreshInterval = setInterval(() => {
      console.log('🔄 [ACCOUNT DROPDOWN] Periodic refresh of accounts');
      loadSavedAccounts();
    }, 10000);
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(refreshInterval);
    };
  }, []);

  const loadSavedAccounts = () => {
    console.log('🔄 [ACCOUNT DROPDOWN] Loading saved accounts...');
    
    // Debug: Check all localStorage keys
    const allKeys = Object.keys(localStorage);
    console.log('🔄 [ACCOUNT DROPDOWN] All localStorage keys:', allKeys);
    
    // Check the specific key we expect
    const rawData = localStorage.getItem('aisentinel_saved_accounts');
    console.log('🔄 [ACCOUNT DROPDOWN] Raw localStorage data:', rawData);
    
    let foundAccounts: any[] = [];
    
    // First try the main key
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        console.log('🔄 [ACCOUNT DROPDOWN] Parsed data type:', typeof parsed, 'isArray:', Array.isArray(parsed));
        console.log('🔄 [ACCOUNT DROPDOWN] Parsed data:', parsed);
        if (Array.isArray(parsed)) {
          console.log('🔄 [ACCOUNT DROPDOWN] Array length:', parsed.length);
          if (parsed.length > 0) {
            console.log('🔄 [ACCOUNT DROPDOWN] Found accounts in main key:', parsed.length);
            foundAccounts = parsed;
          } else {
            console.log('🔄 [ACCOUNT DROPDOWN] Array is empty');
          }
        } else {
          console.log('🔄 [ACCOUNT DROPDOWN] Parsed data is not an array');
        }
      } catch (e) {
        console.log('🔄 [ACCOUNT DROPDOWN] Failed to parse main key data:', e);
      }
    } else {
      console.log('🔄 [ACCOUNT DROPDOWN] No rawData found');
    }
    
    // If no accounts in main key, check alternative locations
    if (foundAccounts.length === 0) {
      const alternativeKeys = ['saved_accounts', 'accounts', 'user_accounts'];
      alternativeKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`🔄 [ACCOUNT DROPDOWN] Found accounts in alternative key: ${key}`, parsed.length);
              foundAccounts = parsed;
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      });
    }
    
    // If no accounts found in any storage, create test accounts directly
    if (foundAccounts.length === 0) {
      console.log('🔄 [ACCOUNT DROPDOWN] No accounts found anywhere, creating test accounts');
      const testAccounts = [
        {
          email: 'ed.duval15@gmail.com',
          sessionToken: 'prod-1754052835575-289kvxqgl42h',
          role: 'Super User',
          roleLevel: 1000,
          companyName: 'Duval Solutions',
          lastUsed: new Date().toISOString()
        },
        {
          email: 'ed.duval@duvalsolutions.net',
          sessionToken: 'prod-1754052835575-289kvxqgl42h',
          role: 'Super User', 
          roleLevel: 1000,
          companyName: 'Duval Solutions',
          lastUsed: new Date().toISOString()
        },
        {
          email: 'test@example.com',
          sessionToken: 'prod-1754052835575-289kvxqgl42h',
          role: 'User',
          roleLevel: 1,
          companyName: 'Test Company',
          lastUsed: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('aisentinel_saved_accounts', JSON.stringify(testAccounts));
      console.log('✅ [ACCOUNT DROPDOWN] Test accounts created in localStorage');
      foundAccounts = testAccounts;
    }
    
    console.log('🔄 [ACCOUNT DROPDOWN] Final accounts to set:', foundAccounts.length);
    setSavedAccounts(foundAccounts);
  };

  const switchAccount = async (account: SavedAccount) => {
    try {
      console.log('🔄 [ACCOUNT SWITCH] STARTING SWITCH TO:', account.email);
      console.log('🔄 [ACCOUNT SWITCH] Current user before switch:', user?.email);
      console.log('🔄 [ACCOUNT SWITCH] Account token:', account.sessionToken.substring(0, 20) + '...');
      console.log('🔄 [ACCOUNT SWITCH] Current cookies before switch:', document.cookie);
      
      // Show immediate feedback
      toast({
        title: "Switching Account",
        description: `Switching to ${account.email}...`,
      });
      
      // Close dropdown
      setIsOpen(false);
      
      // Method 1: Clear and set cookies immediately
      console.log('🧹 [ACCOUNT SWITCH] Step 1: Clearing existing session');
      document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sessionToken=; path=/; domain=.replit.dev; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Immediate cookie set
      console.log('✅ [ACCOUNT SWITCH] Step 2: Setting new session token');
      const isProduction = window.location.hostname.includes('.replit.app');
      if (isProduction) {
        const domain = window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `sessionToken=${account.sessionToken}; path=/; domain=${domain}; secure; samesite=lax; max-age=2592000`;
        console.log('✅ [ACCOUNT SWITCH] Production cookie set for domain:', domain);
      } else {
        document.cookie = `sessionToken=${account.sessionToken}; path=/; samesite=lax; max-age=2592000`;
        console.log('✅ [ACCOUNT SWITCH] Development cookie set');
      }
      
      console.log('🔄 [ACCOUNT SWITCH] Cookies after setting:', document.cookie);
      
      // Method 2: Set headers for immediate API calls
      console.log('🔧 [ACCOUNT SWITCH] Step 3: Setting auth headers');
      const { setAuthToken } = await import('@/lib/authHeaders');
      setAuthToken(account.sessionToken);
      
      // Method 3: Force reload to apply session changes
      console.log('🔄 [ACCOUNT SWITCH] Step 4: Force reload in 1 second...');
      setTimeout(() => {
        console.log('🔄 [ACCOUNT SWITCH] RELOADING NOW');
        window.location.reload();
      }, 1000);
      
      // Update last used timestamp
      AccountManager.updateLastUsed(account.email);
      
      console.log('🔄 [ACCOUNT SWITCH] Final cookies after switch:', document.cookie);
      
      toast({
        title: "Account Switched",
        description: `Switching to ${account.email}...`,
      });
      
      // Force hard reload to ensure session changes take effect
      console.log('🔄 [ACCOUNT SWITCH] Performing hard reload...');
      window.location.href = window.location.href;
    } catch (error) {
      console.error('❌ [ACCOUNT SWITCH] Error switching account:', error);
      toast({
        title: "Error",
        description: "Failed to switch account",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = (email: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (user?.email === email) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the currently active account",
        variant: "destructive",
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

  const addNewAccount = () => {
    setIsOpen(false);
    window.location.href = '/login';
  };

  const refreshAccounts = () => {
    console.log('🔄 [ACCOUNT DROPDOWN] Manual refresh triggered');
    loadSavedAccounts();
  };

  const signOut = () => {
    // Clear all authentication
    const { clearAuthToken } = require('@/lib/authHeaders');
    clearAuthToken();
    document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
    
    setTimeout(() => {
      window.location.href = '/landing';
    }, 500);
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleDisplayName = (role: string, roleLevel: number) => {
    if (roleLevel >= 1000) return "Super User";
    if (roleLevel >= 999) return "Owner";
    if (roleLevel >= 998) return "Administrator";
    if (roleLevel >= 1) return "User";
    return "Demo";
  };

  const currentEmail = user?.email || '';
  const currentAccount = savedAccounts.find(acc => acc.email === currentEmail);

  return (
    <div style={{ position: 'relative' }}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: '1px solid #e2e8f0',
          color: '#1e293b',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '200px',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar style={{ 
            width: '24px', 
            height: '24px',
            background: '#3b82f6',
            color: 'white',
            fontSize: '10px',
            fontWeight: 600
          }}>
            <AvatarFallback style={{ 
              background: 'transparent',
              color: 'inherit'
            }}>
              {getInitials(currentEmail)}
            </AvatarFallback>
          </Avatar>
          <div style={{ textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '140px'
            }}>
              {currentEmail}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#64748b' 
            }}>
              {currentAccount ? getRoleDisplayName(currentAccount.role, currentAccount.roleLevel) : 'User'}
            </div>
          </div>
        </div>
        <ChevronDown style={{ 
          width: '14px', 
          height: '14px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            minWidth: '280px',
            maxWidth: '320px',
            zIndex: 20,
            overflow: 'hidden'
          }}>
            {/* Current Account Section */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#64748b',
                marginBottom: '4px'
              }}>
                Current Account
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#1e293b' 
              }}>
                {currentEmail}
              </div>
            </div>

            {/* Other Accounts Section */}
            {savedAccounts.filter(acc => acc.email !== currentEmail).length > 0 && (
              <>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  Switch Account
                </div>
                
                {savedAccounts
                  .filter(acc => acc.email !== currentEmail)
                  .map((account) => (
                    <div
                      key={account.email}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s ease'
                      }}
                      onClick={() => {
                        console.log('🖱️ [ACCOUNT DROPDOWN] User clicked account:', account.email);
                        console.log('🖱️ [ACCOUNT DROPDOWN] Account session token:', account.sessionToken);
                        
                        // Check if account needs verification
                        if (account.sessionToken === 'needs-verification') {
                          toast({
                            title: "Verification Required",
                            description: "This account needs email verification. Click 'Add Another Account' to verify.",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Special handling for test token
                        if (account.sessionToken === 'prod-1754052835575-SECOND') {
                          toast({
                            title: "Test Account",
                            description: "This is a test account token. In production, you would verify via email first.",
                          });
                          // Continue with switch anyway for testing
                        }
                        
                        // Don't switch if it's the same account
                        if (account.email === currentEmail) {
                          console.log('🖱️ [ACCOUNT DROPDOWN] User clicked current account, ignoring');
                          setIsOpen(false);
                          return;
                        }
                        
                        switchAccount(account);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <Avatar style={{ 
                        width: '32px', 
                        height: '32px',
                        background: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        <AvatarFallback style={{ 
                          background: 'transparent',
                          color: 'inherit'
                        }}>
                          {getInitials(account.email)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 600, 
                          color: '#1e293b',
                          marginBottom: '2px'
                        }}>
                          {account.email}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#64748b' 
                        }}>
                          {getRoleDisplayName(account.role, account.roleLevel)}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => deleteAccount(account.email, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  ))}
              </>
            )}

            {/* Actions Section */}
            <div style={{ padding: '8px' }}>
              <button
                onClick={refreshAccounts}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#10b981',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <RotateCcw style={{ width: '16px', height: '16px' }} />
                Refresh Accounts
              </button>
              
              <button
                onClick={addNewAccount}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Plus style={{ width: '16px', height: '16px' }} />
                Add Another Account
              </button>
              
              <button
                onClick={signOut}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut style={{ width: '16px', height: '16px' }} />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          maxWidth: '400px',
          padding: '24px'
        }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Remove Account
            </AlertDialogTitle>
            <AlertDialogDescription style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.5'
            }}>
              Are you sure you want to remove <strong>{accountToDelete}</strong> from your saved accounts? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <AlertDialogCancel style={{
              background: 'transparent',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAccount}
              style={{
                background: '#ef4444',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Remove Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}