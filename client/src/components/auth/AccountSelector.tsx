import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, LogIn, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedAccount {
  email: string;
  sessionToken: string;
  lastUsed: string;
  role: string;
  roleLevel: number;
  companyName?: string;
}

interface AccountSelectorProps {
  onAccountSelected: (sessionToken: string) => void;
  onNewAccount: () => void;
}

export default function AccountSelector({ onAccountSelected, onNewAccount }: AccountSelectorProps) {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedAccounts();
  }, []);

  const loadSavedAccounts = () => {
    try {
      const accounts = localStorage.getItem('aisentinel_saved_accounts');
      if (accounts) {
        const parsed = JSON.parse(accounts);
        // Sort by last used date (most recent first)
        const sorted = parsed.sort((a: SavedAccount, b: SavedAccount) => 
          new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        );
        setSavedAccounts(sorted);
        
        // If only one account, auto-select it
        if (sorted.length === 1) {
          console.log('Single account found, auto-selecting:', sorted[0].email);
          setTimeout(() => {
            onAccountSelected(sorted[0].sessionToken);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error loading saved accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = (email: string) => {
    try {
      const updatedAccounts = savedAccounts.filter(account => account.email !== email);
      setSavedAccounts(updatedAccounts);
      localStorage.setItem('aisentinel_saved_accounts', JSON.stringify(updatedAccounts));
      
      // Also remove individual auth token if it exists
      const { getAuthToken, clearAuthToken } = require('@/lib/authHeaders');
      const currentToken = getAuthToken();
      const accountToDelete = savedAccounts.find(acc => acc.email === email);
      if (accountToDelete && currentToken === accountToDelete.sessionToken) {
        clearAuthToken();
      }
      
      toast({
        title: "Account Removed",
        description: `Removed ${email} from saved accounts`,
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to remove account",
        variant: "destructive",
      });
    }
  };

  const selectAccount = (account: SavedAccount) => {
    // Update last used timestamp
    const updatedAccounts = savedAccounts.map(acc => 
      acc.email === account.email 
        ? { ...acc, lastUsed: new Date().toISOString() }
        : acc
    );
    setSavedAccounts(updatedAccounts);
    localStorage.setItem('aisentinel_saved_accounts', JSON.stringify(updatedAccounts));
    
    console.log('Account selected:', account.email);
    onAccountSelected(account.sessionToken);
  };

  const getRoleDisplayName = (role: string, roleLevel: number) => {
    if (roleLevel >= 1000) return "Super User";
    if (roleLevel >= 999) return "Owner";
    if (roleLevel >= 998) return "Administrator";
    if (roleLevel >= 1) return "User";
    return "Demo";
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e2e8f0', 
            borderTop: '3px solid #3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{ color: '#64748b' }}>Loading accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '24px' 
    }}>
      <Card>
        <CardHeader style={{ textAlign: 'center' }}>
          <CardTitle style={{ fontSize: '24px', marginBottom: '8px' }}>
            Choose Your Account
          </CardTitle>
          <CardDescription>
            Select from your saved accounts or add a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                opacity: 0.5 
              }}>👤</div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                marginBottom: '8px',
                color: '#1e293b'
              }}>
                No Saved Accounts
              </h3>
              <p style={{ 
                color: '#64748b', 
                marginBottom: '24px' 
              }}>
                Get started by adding your first account
              </p>
              <Button onClick={onNewAccount} style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Plus style={{ width: '16px', height: '16px' }} />
                Add Account
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedAccounts.map((account) => (
                <div 
                  key={account.email}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: 'white',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Avatar style={{ 
                    width: '48px', 
                    height: '48px',
                    background: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: '16px',
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
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {account.email}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      marginBottom: '2px'
                    }}>
                      {getRoleDisplayName(account.role, account.roleLevel)}
                      {account.companyName && ` • ${account.companyName}`}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#94a3b8' 
                    }}>
                      Last used: {formatLastUsed(account.lastUsed)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        selectAccount(account);
                      }}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <LogIn style={{ width: '14px', height: '14px' }} />
                      Select
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAccount(account.email);
                      }}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div style={{ 
                textAlign: 'center', 
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <Button onClick={onNewAccount} style={{
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Add New Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}