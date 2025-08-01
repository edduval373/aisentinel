import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountManager } from "@/lib/accountManager";
import { RefreshCcw, Trash2, Plus } from "lucide-react";

interface SavedAccount {
  email: string;
  sessionToken: string;
  lastUsed: string;
  role: string;
  roleLevel: number;
  companyName?: string;
}

export default function AccountDebugger() {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [rawData, setRawData] = useState<string>('');
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testRoleLevel, setTestRoleLevel] = useState(1);

  const refreshData = () => {
    // Get accounts via AccountManager
    const savedAccounts = AccountManager.getSavedAccounts();
    setAccounts(savedAccounts);

    // Get raw localStorage data
    const raw = localStorage.getItem('aisentinel_saved_accounts');
    setRawData(raw || 'null');

    console.log('📊 [DEBUG] Account refresh:', {
      accountCount: savedAccounts.length,
      rawDataLength: raw?.length || 0,
      accounts: savedAccounts.map(acc => ({ email: acc.email, roleLevel: acc.roleLevel }))
    });
  };

  useEffect(() => {
    refreshData();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      console.log('📊 [DEBUG] Storage changed, refreshing...');
      refreshData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const testSaveAccount = () => {
    const testAccount = {
      email: testEmail,
      sessionToken: `test-token-${Date.now()}`,
      role: testRoleLevel >= 1000 ? 'Super User' : testRoleLevel >= 99 ? 'Owner' : 'User',
      roleLevel: testRoleLevel,
      companyName: 'Test Company'
    };

    console.log('📊 [DEBUG] Testing account save:', testAccount);
    AccountManager.saveAccount(testAccount);
    refreshData();
  };

  const clearAllAccounts = () => {
    if (confirm('Clear all saved accounts?')) {
      AccountManager.clearAllAccounts();
      refreshData();
    }
  };

  const manualAddSecondAccount = () => {
    const secondAccount = {
      email: 'ed.duval@duvalsolutions.net',
      sessionToken: `manual-token-${Date.now()}`,
      role: 'Super User',
      roleLevel: 1000,
      companyName: 'Duval Solutions'
    };

    console.log('📊 [DEBUG] Manually adding second account:', secondAccount);
    AccountManager.saveAccount(secondAccount);
    refreshData();
  };

  return (
    <Card style={{ margin: '20px', maxWidth: '800px' }}>
      <CardHeader>
        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Account Debug Tool</span>
          <Button size="sm" onClick={refreshData}>
            <RefreshCcw style={{ width: '16px', height: '16px' }} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Saved Accounts Display */}
        <div>
          <h3 style={{ marginBottom: '10px', fontWeight: 600 }}>
            Saved Accounts ({accounts.length})
          </h3>
          {accounts.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No saved accounts found</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {accounts.map((account, index) => (
                <div 
                  key={account.email}
                  style={{
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {index + 1}. {account.email}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Role Level: {account.roleLevel} | 
                    Last Used: {new Date(account.lastUsed).toLocaleString()} |
                    Token: {account.sessionToken.substring(0, 20)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Raw Data Display */}
        <div>
          <h3 style={{ marginBottom: '10px', fontWeight: 600 }}>Raw localStorage Data</h3>
          <pre style={{
            background: '#f1f5f9',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {rawData}
          </pre>
        </div>

        {/* Test Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontWeight: 600 }}>Test Controls</h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Test email"
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <select
              value={testRoleLevel}
              onChange={(e) => setTestRoleLevel(parseInt(e.target.value))}
              style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value={1}>User (1)</option>
              <option value={98}>Admin (98)</option>
              <option value={99}>Owner (99)</option>
              <option value={1000}>Super User (1000)</option>
            </select>
            <Button onClick={testSaveAccount}>
              <Plus style={{ width: '16px', height: '16px', marginRight: '4px' }} />
              Test Save
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={manualAddSecondAccount} variant="outline">
              Add ed.duval@duvalsolutions.net
            </Button>
            <Button onClick={clearAllAccounts} variant="destructive">
              <Trash2 style={{ width: '16px', height: '16px', marginRight: '4px' }} />
              Clear All
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}