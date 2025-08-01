import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, User, LogOut, Trash2, Plus, RotateCcw } from "lucide-react";
import { AccountManager } from "@/lib/accountManager";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
    const accounts = AccountManager.getSavedAccounts();
    console.log('🔄 [ACCOUNT DROPDOWN] Loading saved accounts:', accounts);
    console.log('🔄 [ACCOUNT DROPDOWN] Account count:', accounts.length);
    accounts.forEach((acc, i) => {
      console.log(`🔄 [ACCOUNT DROPDOWN] Account ${i+1}:`, {
        email: acc.email,
        roleLevel: acc.roleLevel,
        lastUsed: acc.lastUsed
      });
    });
    setSavedAccounts(accounts);
  };

  const switchAccount = async (account: SavedAccount) => {
    try {
      console.log('🔄 [ACCOUNT SWITCH] Switching to account:', account.email);
      console.log('🔄 [ACCOUNT SWITCH] Current cookies before switch:', document.cookie);
      
      // First clear existing session
      document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      console.log('🧹 [ACCOUNT SWITCH] Cleared existing session cookie');
      
      // Wait a moment for cookie clearing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set new session token - use domain-specific approach for production
      const isProduction = window.location.hostname.includes('.replit.app');
      if (isProduction) {
        // For production, set cookie for the main domain
        const domain = window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `sessionToken=${account.sessionToken}; path=/; domain=${domain}; secure; samesite=lax; max-age=2592000`;
        console.log('✅ [ACCOUNT SWITCH] Set production cookie for domain:', domain);
      } else {
        // For development
        document.cookie = `sessionToken=${account.sessionToken}; path=/; samesite=lax; max-age=2592000`;
        console.log('✅ [ACCOUNT SWITCH] Set development cookie');
      }
      
      // Set headers for immediate API calls
      const { setAuthToken } = await import('@/lib/authHeaders');
      setAuthToken(account.sessionToken);
      console.log('✅ [ACCOUNT SWITCH] Auth token set in headers');
      
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
    
    AccountManager.removeAccount(email);
    loadSavedAccounts();
    
    toast({
      title: "Account Removed",
      description: `Removed ${email} from saved accounts`,
    });
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
                        // Check if account needs verification
                        if (account.sessionToken === 'needs-verification') {
                          toast({
                            title: "Verification Required",
                            description: "This account needs email verification. Click 'Add Another Account' to verify.",
                            variant: "destructive",
                          });
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
    </div>
  );
}