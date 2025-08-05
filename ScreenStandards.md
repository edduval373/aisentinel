# Screen Standards for AI Sentinel Admin Interface

## Overview
This document defines the comprehensive standards for all admin screens in the AI Sentinel platform based on the **Company Management screen** - our fully implemented, tested, and debugged reference implementation. These standards ensure consistency, security, and usability across all administrative interfaces. **CRITICAL: NO HARDCODING DATA, NO DUMMY DATA, MOCK DATA, ALTERNATE DATA, NO ALTERNATIVE SOLUTIONS OR HALLUCINATIONS ALLOWED.**

## Reference Implementation: Company Management Screen
The Company Management screen (`client/src/pages/admin/company-management.tsx`) serves as the gold standard for all admin screens. It demonstrates:
- Complete CRUD operations with real Railway PostgreSQL data
- Real-time duplicate validation for both company names and domains
- Professional visual design with blue headers and green badges
- Comprehensive error handling and user feedback
- Role-based authentication with super-user (1000+) access
- Pure CSS inline styling (NO Tailwind CSS)

## Authentication Strategy

### Production Authentication Requirements
- **Primary Method**: Header-based authentication using production token `prod-1754052835575-289kvxqgl42h`
- **Headers Required**: `Authorization: Bearer {token}` AND `X-Session-Token: {token}`
- **Role-Based Access**: Strict hierarchical validation
  - Demo (0): Sidebar + read-only company ID 1 options
  - User (1): No sidebar access
  - Admin (998+): Admin section only
  - Owner (999+): Owners + admin sections  
  - Super-user (1000+): All sections access
- **Fallback Strategy**: NO fallbacks allowed - authentication must be strict
- **Database Validation**: All authentication validated against Railway PostgreSQL database

### Authentication Implementation Pattern (From Company Management)
```typescript
// Server-side authentication (server/routes.ts pattern)
🌐 API Request: GET /api/admin/companies
✅ [COMPANIES] Header auth successful: userId=42450602, roleLevel=1000
✅ [COMPANIES] Fetching companies for super-user...

// Frontend authentication headers (company-management.tsx pattern)
const headers = {
  'Authorization': `Bearer ${token}`,
  'X-Session-Token': token,
  'Content-Type': 'application/json'
};

// React Query authentication pattern
const { data: companies, isLoading: companiesLoading, error: companiesError, refetch } = useQuery({
  queryKey: ['/api/admin/companies'],
  enabled: !!user && user.roleLevel >= 1000,
  staleTime: 30000,
});
```

## Visual Design Standards

### Color Palette (Company Management Reference)
- **Primary Blue**: `#3b82f6` (headers, section titles, primary actions)
- **Success Green**: `#10b981` (submit buttons, success validation, active badges)
- **Error Red**: `#ef4444` (validation errors, destructive actions, required asterisks)
- **Warning Orange**: `#f59e0b` (warnings, pending states)
- **Gray Neutral**: `#6b7280` (secondary text, disabled states)
- **Gradient Headers**: `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)`
- **Background Colors**:
  - Success validation: `#f0fdf4` with border `#bbf7d0`
  - Error validation: `#fef2f2` with border `#fecaca`
  - Card backgrounds: `#ffffff` with subtle shadows
  - Page background: `#f8fafc`

### Typography Standards (Company Management Pattern)
- **Page Headers**: Blue gradient (`linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)`), white text, `fontSize: '32px', fontWeight: 'bold'`
- **Section Headers**: Blue (`#3b82f6`), `fontSize: '24px', fontWeight: '600'`
- **Required Fields**: Red asterisk (`#dc2626`) before label with text "Must be unique" where applicable
- **Field Labels**: `fontSize: '14px', fontWeight: '500'`, includes uniqueness requirements
- **Validation Messages**: `fontSize: '13px', fontWeight: '500'` with emoji indicators (❌/✅)
- **Error Text**: Red (`#ef4444`) with light red background
- **Success Text**: Green (`#10b981`) with light green background
- **Badge Text**: White text on green (`#10b981`) background with `padding: '4px 8px'`

### Layout Standards (Company Management Pattern)
- **Grid Layout**: Three-column responsive grid (`display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px'`)
- **Card Design**: White background, `boxShadow: '0 2px 4px rgba(0,0,0,0.1)'`, hover effects with scale transform
- **Modal Width**: Standard Radix dialog width with `padding: '24px'`
- **Header Layout**: Full-width gradient header with centered content
- **Button Positioning**: "Add Company" button top-right with blue primary styling
- **Spacing Standards**: `gap: '24px'` for grid, `margin: '16px 0'` for sections, `padding: '20px'` for cards
- **Border Radius**: `borderRadius: '12px'` for cards, `8px` for buttons and inputs, `4px` for badges

## CRUD Operations Standards

### Create Operations
1. **Modal Structure**: 
   - Clear title "Add New {Entity}"
   - Form with proper validation
   - Submit button disabled during submission
   - Loading states with descriptive text

2. **Validation Requirements**:
   - Real-time duplicate checking (300ms debounce)
   - Visual feedback with colored borders
   - Error messages with background highlights
   - Submit prevention when conflicts exist

3. **Success Handling**:
   - Immediate cache invalidation
   - Toast notification with success message
   - Modal auto-close
   - List refresh without page reload

### Read Operations
1. **Data Loading**:
   - Loading spinners during fetch
   - Error states with retry options
   - Empty states with clear messaging
   - Proper TypeScript typing

2. **List Display**:
   - Card-based layout with consistent styling
   - Status badges with appropriate colors
   - Action buttons clearly visible
   - Responsive design for mobile/tablet

### Update Operations
1. **Edit Modal**:
   - Pre-populated form fields
   - Same validation as create
   - "Update {Entity}" button text
   - Exclusion of current record from duplicate checks

2. **Optimistic Updates**:
   - Immediate UI updates
   - Rollback on failure
   - Clear error messaging
   - Cache invalidation on success

### Delete Operations
1. **Confirmation Modal**:
   - Clear warning message
   - Entity details displayed
   - "Are you sure?" confirmation
   - Destructive action styling (red)

2. **Safety Measures**:
   - No accidental deletions
   - Clear consequences explained
   - Foreign key constraint handling
   - Cascade deletion documentation

## Validation Standards

### Real-Time Validation
- **Debounce Timing**: 300ms for optimal UX
- **Visual Feedback**: 
  - Red border + background for errors
  - Green border + background for success
  - Loading spinner during validation
  - Clear error/success messages

### Duplicate Checking Implementation (Company Management Pattern)
```typescript
// EXACT pattern from company-management.tsx - USE THIS PATTERN
const [domainCheckResult, setDomainCheckResult] = useState<{
  checking: boolean;
  exists: boolean;
  message: string;
}>({ checking: false, exists: false, message: "" });

const [nameCheckResult, setNameCheckResult] = useState<{
  checking: boolean;
  exists: boolean;
  message: string;
}>({ checking: false, exists: false, message: "" });

// Domain checking (adapt for other unique fields)
const checkDomainAvailability = React.useCallback(
  React.useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (domain: string) => {
      clearTimeout(timeoutId);
      
      if (!domain || domain.length < 2) {
        setDomainCheckResult({ checking: false, exists: false, message: "" });
        return;
      }

      setDomainCheckResult({ checking: true, exists: false, message: "Checking domain..." });
      
      timeoutId = setTimeout(async () => {
        const domainExists = companies.some(company => 
          company.domain?.toLowerCase() === domain.toLowerCase() && 
          (!editingCompany || company.id !== editingCompany.id)
        );
        
        if (domainExists) {
          setDomainCheckResult({ 
            checking: false, 
            exists: true, 
            message: "❌ This domain is already used by another company" 
          });
        } else {
          setDomainCheckResult({ 
            checking: false, 
            exists: false, 
            message: "✅ Domain is available" 
          });
        }
      }, 300); // 300ms debounce - PROVEN OPTIMAL TIMING
    };
  }, [companies, editingCompany]),
  [companies, editingCompany]
);

// Form field implementation with validation styling
<Input 
  placeholder="example.com (must be unique)" 
  {...field} 
  onChange={(e) => {
    field.onChange(e);
    checkDomainAvailability(e.target.value);
  }}
  style={{
    borderColor: domainCheckResult.exists ? '#ef4444' : 
                domainCheckResult.message.includes("✅") ? '#10b981' : '#d1d5db'
  }}
/>

// Visual feedback message
{domainCheckResult.message && (
  <div style={{ 
    fontSize: '13px', 
    marginTop: '4px',
    fontWeight: '500',
    color: domainCheckResult.checking ? '#6b7280' :
           domainCheckResult.exists ? '#ef4444' : '#10b981',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: domainCheckResult.exists ? '#fef2f2' : 
                    domainCheckResult.message.includes("✅") ? '#f0fdf4' : 'transparent',
    padding: domainCheckResult.message ? '6px 8px' : '0',
    borderRadius: '4px',
    border: domainCheckResult.exists ? '1px solid #fecaca' : 
           domainCheckResult.message.includes("✅") ? '1px solid #bbf7d0' : 'none'
  }}>
    {domainCheckResult.checking && (
      <div style={{
        width: '12px',
        height: '12px',
        border: '2px solid #e5e7eb',
        borderTop: '2px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    )}
    {domainCheckResult.message}
  </div>
)}
```

### Form Validation Messages (Company Management Standards)
- **Required Fields**: "This field is required"
- **Format Errors**: "Please enter a valid {format}"
- **Duplicate Errors**: 
  - Domain: "❌ This domain is already used by another company"
  - Name: "❌ This company name is already taken"
- **Success Messages**: 
  - Domain: "✅ Domain is available"
  - Name: "✅ Company name is available"
- **Length Errors**: "Must be between {min} and {max} characters"
- **Checking Status**: "Checking domain..." or "Checking name..."

### Submit Button States (Company Management Pattern)
```typescript
// Submit button with comprehensive validation state handling
<Button 
  type="submit" 
  disabled={createMutation.isPending || updateMutation.isPending || 
           domainCheckResult.exists || domainCheckResult.checking || 
           nameCheckResult.exists || nameCheckResult.checking}
  style={{ 
    width: '100%',
    backgroundColor: (domainCheckResult.exists || domainCheckResult.checking || 
                     nameCheckResult.exists || nameCheckResult.checking) ? '#9ca3af' : '#10b981',
    color: 'white',
    border: (conflicts) ? '1px solid #9ca3af' : '1px solid #10b981',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: (conflicts) ? 'not-allowed' : 'pointer',
    opacity: (pending || checking) ? 0.7 : 1
  }}
>
  {(domainCheckResult.checking || nameCheckResult.checking) ? "Checking..." :
   domainCheckResult.exists ? "Domain unavailable" :
   nameCheckResult.exists ? "Name unavailable" :
   editingItem 
    ? (updateMutation.isPending ? "Updating..." : "Update {Entity}")
    : (createMutation.isPending ? "Creating..." : "Create {Entity}")
  }
</Button>
```

## Error Handling Standards

### API Error Responses
```typescript
// Standard error response format
{
  error: "Operation failed",
  details: {
    field: "specific error message",
    code: "ERROR_CODE",
    timestamp: "2025-08-05T10:00:00Z"
  }
}
```

### Frontend Error Handling
- **Toast Notifications**: For operation results
- **Inline Validation**: For form field errors
- **Modal Errors**: For submission failures
- **Retry Mechanisms**: For network failures
- **Graceful Degradation**: Fallback UI states

### Error Message Standards
- **Clear and Actionable**: Tell user exactly what went wrong
- **No Technical Jargon**: User-friendly language
- **Solution-Oriented**: Suggest how to fix the issue
- **Consistent Tone**: Professional but helpful

## CSS Implementation Standards

### NO Tailwind CSS Policy
- **CRITICAL**: Pure CSS with inline styles ONLY
- **Component Styling**: All styles defined inline
- **Consistency**: Use style objects for reusable patterns
- **Browser Compatibility**: Cross-environment consistency guaranteed

### Standard Style Patterns (Company Management Reference)
```typescript
// Page Header (EXACT from company-management.tsx)
const pageHeaderStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: 'white',
  padding: '40px 0',
  marginBottom: '32px',
  textAlign: 'center' as const,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

// Grid Container (EXACT from company-management.tsx)
const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  gap: '24px',
  padding: '0 32px'
};

// Company Card Style (EXACT from company-management.tsx)
const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  }
};

// Active Badge (EXACT from company-management.tsx)
const activeBadgeStyle = {
  backgroundColor: '#10b981',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500'
};

// Button Styles (Company Management Pattern)
const buttonStyles = {
  primary: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  success: {
    backgroundColor: '#10b981',
    color: 'white',
    border: '1px solid #10b981',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  disabled: {
    backgroundColor: '#9ca3af',
    color: 'white',
    border: '1px solid #9ca3af',
    cursor: 'not-allowed',
    opacity: 0.7
  }
};

// Input Validation Styles (Company Management Pattern)
const inputValidationStyles = {
  base: {
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px'
  },
  error: {
    borderColor: '#ef4444'
  },
  success: {
    borderColor: '#10b981'
  },
  neutral: {
    borderColor: '#d1d5db'
  }
};
```

## Data Standards

### Database Integration
- **NO Mock Data**: All data from Railway PostgreSQL database
- **Real-time Updates**: Live data synchronization
- **Proper Relations**: Foreign key constraints respected
- **Transaction Safety**: ACID compliance maintained

### API Response Standards
```typescript
// Successful response
{
  data: T[],
  total: number,
  page?: number,
  limit?: number
}

// Error response
{
  error: string,
  details: Record<string, any>,
  timestamp: string
}
```

## Performance Standards

### Loading States
- **Immediate Feedback**: Loading indicators appear instantly
- **Descriptive Text**: "Creating company...", "Updating...", "Checking..."
- **Progress Indication**: When possible, show progress
- **Timeout Handling**: Graceful handling of slow operations

### Optimization Techniques
- **Debounced Validation**: 300ms optimal timing
- **React Query Cache**: Proper cache invalidation
- **Optimistic Updates**: Immediate UI feedback
- **Error Boundaries**: Prevent complete UI crashes

## Security Standards

### Input Validation
- **Client-side**: Immediate feedback for UX
- **Server-side**: Authoritative validation
- **Sanitization**: All inputs properly sanitized
- **SQL Injection Prevention**: Parameterized queries only

### Access Control
- **Route Protection**: Role-based route access
- **API Endpoints**: Authentication on every request
- **UI Elements**: Hide/show based on permissions
- **Data Filtering**: Role-appropriate data only

## Testing Standards

### Manual Testing Checklist
- [ ] Authentication with correct role levels
- [ ] Duplicate validation working
- [ ] Form submission with valid data
- [ ] Form submission with invalid data
- [ ] Edit functionality preserves data
- [ ] Delete confirmation and execution
- [ ] Loading states display correctly
- [ ] Error states handle gracefully
- [ ] Responsive design on mobile/tablet
- [ ] Browser compatibility testing

### Edge Cases to Test
- [ ] Network failures during operations
- [ ] Concurrent user modifications
- [ ] Large datasets performance
- [ ] Empty states display
- [ ] Very long field values
- [ ] Special characters in inputs
- [ ] SQL injection attempts
- [ ] Cross-site scripting attempts

## Implementation Checklist

### Before Starting New Admin Screen
1. [ ] **REVIEW ScreenStandards.md** (this document) - MANDATORY
2. [ ] **COPY company-management.tsx structure** as starting template
3. [ ] Identify required role level for access (usually 1000+ for admin screens)
4. [ ] Define data model with unique field constraints
5. [ ] Plan duplicate checking for ALL unique fields
6. [ ] Map out CRUD operations needed
7. [ ] Design error handling strategy

### During Development (Company Management Pattern)
1. [ ] **COPY authentication pattern** from company-management.tsx EXACTLY
2. [ ] **COPY grid layout and styling** from company-management.tsx
3. [ ] **COPY validation patterns** for all unique fields
4. [ ] **COPY submit button states** with all validation checks
5. [ ] **COPY modal structure** with proper form handling
6. [ ] **COPY error message patterns** with emoji indicators
7. [ ] **COPY loading states** and user feedback
8. [ ] Style ONLY with inline CSS (NO Tailwind CSS)
9. [ ] Test duplicate validation for ALL scenarios

### Before Completion (Critical Validation)
1. [ ] **Authentication works with production token**: `prod-1754052835575-289kvxqgl42h`
2. [ ] **ALL unique fields have duplicate checking** with visual feedback
3. [ ] **Submit buttons disabled** when validation conflicts exist
4. [ ] **Error messages clear and actionable** with red backgrounds
5. [ ] **Success messages visible** with green backgrounds and checkmarks
6. [ ] **Loading states descriptive** ("Checking...", "Creating...", etc.)
7. [ ] **Responsive design** matches company management grid layout
8. [ ] **No Tailwind CSS** anywhere in the implementation
9. [ ] **Database operations** use Railway PostgreSQL (no mock data)
10. [ ] **Role-based access** enforced at API and UI levels

### Company Management Success Patterns to Copy
- **Page Header**: Blue gradient with white text
- **Grid Layout**: Three-column responsive with 400px minimum width
- **Card Design**: White background, subtle shadows, hover effects
- **Validation**: Real-time checking with 300ms debounce
- **Submit States**: Disabled when conflicts, descriptive button text
- **Error Handling**: Toast notifications + inline validation
- **Loading**: Spinners with descriptive text
- **Typography**: Consistent sizing and color hierarchy

## Critical Success Factors (Based on Company Management)

### What Makes Company Management Screen Perfect
1. **Real-time validation** that actually works and provides immediate feedback
2. **Visual consistency** with blue headers, green badges, professional styling
3. **Comprehensive error handling** that prevents user confusion
4. **Smooth user experience** with proper loading states and disabled buttons
5. **Production authentication** that works reliably with Railway database
6. **Pure CSS styling** that looks professional without Tailwind dependencies

### Common Pitfalls to Avoid
- **Mock data usage**: Always use real Railway PostgreSQL data
- **Missing duplicate validation**: Every unique field needs real-time checking
- **Poor error messages**: Be specific about what went wrong and how to fix it
- **Inconsistent styling**: Match company management visual patterns exactly
- **Authentication shortcuts**: Use full header-based auth pattern
- **Tailwind CSS**: Strictly forbidden - use inline styles only

### Key Files to Reference
- `client/src/pages/admin/company-management.tsx` - Complete reference implementation
- `server/routes.ts` - Authentication and API patterns
- `shared/schema.ts` - Type definitions and validation
- `ScreenStandards.md` - This document for all standards

## Notes for Future Implementation
- **ALWAYS copy company-management.tsx patterns** - don't reinvent
- **Start with authentication and role checking** using exact same pattern
- **Implement validation before styling** to ensure functionality first
- **Test duplicate checking thoroughly** for all edge cases
- **Never skip error handling** - users must know what's happening
- **Maintain visual consistency** with company management screen
- **Update this document** when new patterns are discovered and proven successful

---

**Created**: August 5, 2025  
**Based On**: Company Management Screen (fully tested and debugged)  
**Last Updated**: August 5, 2025  
**Version**: 1.0  
**Status**: Active Standard - Use for ALL new admin screens