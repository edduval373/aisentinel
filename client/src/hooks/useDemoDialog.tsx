import React, { useState } from 'react';
import DemoInfoDialog from '../components/demo/DemoInfoDialog';

interface DemoDialogConfig {
  title: string;
  description: string;
  features?: string[];
}

export function useDemoDialog() {
  const [dialogConfig, setDialogConfig] = useState<DemoDialogConfig | null>(null);

  const showDialog = (config: DemoDialogConfig) => {
    setDialogConfig(config);
  };

  const closeDialog = () => {
    setDialogConfig(null);
  };

  const DialogComponent = () => (
    <DemoInfoDialog
      isOpen={!!dialogConfig}
      onClose={closeDialog}
      title={dialogConfig?.title || ''}
      description={dialogConfig?.description || ''}
      features={dialogConfig?.features}
    />
  );

  return {
    showDialog,
    closeDialog,
    DialogComponent,
    isOpen: !!dialogConfig
  };
}

// Predefined dialog configurations for common admin features
export const DEMO_DIALOGS = {
  COMPANY_SETUP: {
    title: 'Company Setup',
    description: 'Configure your company profile, branding, and display preferences. This includes uploading your company logo, setting display sizes, and managing company information.',
    features: [
      'Upload and crop company logo with interactive editing tools',
      'Configure logo size and company name display settings',
      'Preview how your branding appears in the chat interface',
      'Manage company information and contact details',
      'Control visual hierarchy and branding consistency'
    ]
  },
  
  CREATE_AI_MODELS: {
    title: 'Create AI Models',
    description: 'Design and configure custom AI models tailored to your organization\'s specific needs. Set up multiple AI providers with different capabilities and parameters.',
    features: [
      'Configure multiple AI providers (OpenAI, Anthropic, Google, etc.)',
      'Set model parameters like temperature and context windows',
      'Create custom model combinations for different use cases',
      'Test model responses before deployment',
      'Enable or disable models based on your requirements'
    ]
  },
  
  MODEL_FUSION: {
    title: 'Model Fusion',
    description: 'Advanced feature that combines responses from multiple AI models to provide more comprehensive and accurate results for complex queries.',
    features: [
      'Query multiple AI models simultaneously',
      'Automatic response synthesis and comparison',
      'Configure which models participate in fusion',
      'Select summary model for final response generation',
      'Enhanced accuracy through model consensus'
    ]
  },
  
  SETUP_API_KEYS: {
    title: 'Setup API Keys',
    description: 'Manage API keys for various AI providers to enable model functionality. Each company maintains their own secure API key configuration.',
    features: [
      'Secure storage of API keys for multiple providers',
      'Test API key validity and connection status',
      'Support for OpenAI, Anthropic, Google, and other providers',
      'Company-specific key management and isolation',
      'Real-time connection status monitoring'
    ]
  },
  
  USER_MANAGEMENT: {
    title: 'User Management',
    description: 'Comprehensive user administration including inviting team members, managing roles, and tracking user activity within your organization.',
    features: [
      'Invite new users with email-based verification',
      'Assign roles and permission levels',
      'Track user activity and session statistics',
      'Manage user profiles and department assignments',
      'View comprehensive user analytics and engagement metrics'
    ]
  },
  
  ANALYTICS: {
    title: 'Analytics & Reports',
    description: 'Detailed insights into AI usage patterns, user engagement, and system performance with comprehensive reporting capabilities.',
    features: [
      'AI interaction statistics and usage trends',
      'User engagement metrics and activity tracking',
      'Model performance comparisons and insights',
      'Export capabilities for compliance reporting',
      'Real-time dashboard with key performance indicators'
    ]
  },
  
  CONTENT_POLICIES: {
    title: 'Content Policies',
    description: 'Configure content filtering, security rules, and compliance settings to ensure safe and appropriate AI interactions.',
    features: [
      'Content filtering with severity levels and custom rules',
      'Security configuration including PII detection',
      'Compliance settings for industry standards',
      'Blocked keywords and phrase management',
      'Data retention and privacy controls'
    ]
  },
  
  ACTIVITY_LOGS: {
    title: 'Activity Logs',
    description: 'Monitor and audit all system activities with detailed logging for security, compliance, and troubleshooting purposes.',
    features: [
      'Comprehensive activity tracking and audit trails',
      'User action logging with timestamps',
      'Security event monitoring and alerts',
      'Searchable log entries with filtering options',
      'Export logs for compliance and analysis'
    ]
  },
  
  SECURITY_SETTINGS: {
    title: 'Security Settings',
    description: 'Advanced security configuration including access controls, encryption settings, and threat detection parameters.',
    features: [
      'Multi-factor authentication configuration',
      'Session management and timeout settings',
      'IP restriction and access control lists',
      'Threat detection and response automation',
      'Security audit and compliance monitoring'
    ]
  }
};