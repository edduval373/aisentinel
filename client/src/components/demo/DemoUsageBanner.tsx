import { useDemoUsage } from "@/hooks/useDemoUsage";
import { useAuth } from "@/hooks/useAuth";

export function DemoUsageBanner() {
  const { user } = useAuth();
  const { data: demoUsage, isLoading } = useDemoUsage();

  // Only show for demo users (role level 0)
  if (!user || user.roleLevel !== 0 || !demoUsage || isLoading) {
    return null;
  }

  const questionsLeft = demoUsage.questionsRemaining;
  const isNearLimit = questionsLeft <= 1;
  const isAtLimit = questionsLeft <= 0;

  return (
    <div style={{
      backgroundColor: isAtLimit ? '#fee2e2' : isNearLimit ? '#fef3c7' : '#dbeafe',
      border: `1px solid ${isAtLimit ? '#fca5a5' : isNearLimit ? '#fcd34d' : '#93c5fd'}`,
      borderRadius: '8px',
      padding: '12px 16px',
      margin: '12px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          backgroundColor: isAtLimit ? '#dc2626' : isNearLimit ? '#d97706' : '#2563eb',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          DEMO
        </span>
        <span style={{ 
          color: isAtLimit ? '#dc2626' : isNearLimit ? '#d97706' : '#1e40af',
          fontWeight: '500'
        }}>
          {isAtLimit 
            ? 'Demo limit reached'
            : `${questionsLeft} question${questionsLeft !== 1 ? 's' : ''} remaining`
          }
        </span>
      </div>
      
      {isAtLimit ? (
        <a 
          href="/pricing" 
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
        >
          Start Free Trial
        </a>
      ) : isNearLimit ? (
        <a 
          href="/pricing" 
          style={{
            backgroundColor: '#d97706',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#b45309')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#d97706')}
        >
          Upgrade Soon
        </a>
      ) : (
        <span style={{ 
          color: '#1e40af',
          fontSize: '12px'
        }}>
          {demoUsage.questionsUsed}/{demoUsage.maxQuestions} used
        </span>
      )}
    </div>
  );
}