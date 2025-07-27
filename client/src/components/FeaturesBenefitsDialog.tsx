import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Bot, 
  Users, 
  BarChart3, 
  Settings, 
  Lock, 
  Eye, 
  FileText, 
  Zap, 
  Globe,
  CheckCircle2,
  ArrowRight,
  X
} from "lucide-react";

interface FeaturesBenefitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  {
    icon: Bot,
    title: "Multi-Model AI Integration",
    description: "Connect with leading AI providers including OpenAI, Anthropic, Google, Cohere, and custom models",
    benefits: [
      "Access to cutting-edge AI capabilities from multiple providers",
      "Reduced vendor lock-in with flexible model switching",
      "Optimized performance by choosing the best model for each task",
      "Future-proof architecture that adapts to new AI developments"
    ],
    category: "AI Technology"
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description: "Comprehensive content filtering, PII detection, and security monitoring for all AI interactions",
    benefits: [
      "Prevent data breaches with automatic PII detection",
      "Ensure compliance with industry regulations",
      "Real-time threat detection and response",
      "Complete audit trails for security investigations"
    ],
    category: "Security"
  },
  {
    icon: Users,
    title: "Role-Based Access Control",
    description: "Hierarchical permission system with granular control over user access and capabilities",
    benefits: [
      "Secure access management with role-based permissions",
      "Reduced administrative overhead with automated role assignment",
      "Enhanced security through principle of least privilege",
      "Simplified compliance with clear access controls"
    ],
    category: "Access Management"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics & Monitoring",
    description: "Real-time dashboards, usage tracking, and comprehensive reporting for AI governance",
    benefits: [
      "Data-driven insights into AI usage patterns",
      "Cost optimization through usage monitoring",
      "Performance metrics to improve AI effectiveness",
      "Compliance reporting for regulatory requirements"
    ],
    category: "Analytics"
  },
  {
    icon: Settings,
    title: "Custom AI Model Creation",
    description: "Build and deploy custom AI models tailored to your organization's specific needs",
    benefits: [
      "Specialized AI capabilities for unique business requirements",
      "Improved accuracy with domain-specific training",
      "Complete control over model behavior and responses",
      "Competitive advantage through proprietary AI solutions"
    ],
    category: "Customization"
  },
  {
    icon: Lock,
    title: "Content Policies & Compliance",
    description: "Configurable content filters, security rules, and compliance frameworks",
    benefits: [
      "Automated compliance with industry standards",
      "Reduced legal risks through content monitoring",
      "Consistent policy enforcement across all interactions",
      "Customizable rules for specific organizational needs"
    ],
    category: "Compliance"
  },
  {
    icon: Eye,
    title: "Real-Time Monitoring",
    description: "Live activity tracking, security alerts, and performance monitoring dashboards",
    benefits: [
      "Immediate detection of security threats or anomalies",
      "Proactive issue resolution before they impact users",
      "Real-time visibility into system performance",
      "Automated alerting for critical events"
    ],
    category: "Monitoring"
  },
  {
    icon: FileText,
    title: "Activity Management",
    description: "Pre-configured activity types with custom prompts and behavior guidelines",
    benefits: [
      "Consistent AI behavior across different use cases",
      "Improved output quality with specialized prompts",
      "Streamlined workflows for common business tasks",
      "Reduced training time for new users"
    ],
    category: "Workflow"
  },
  {
    icon: Zap,
    title: "Model Fusion Technology",
    description: "Combine multiple AI models for enhanced accuracy and comprehensive analysis",
    benefits: [
      "Superior results through multi-model consensus",
      "Reduced bias with diverse AI perspectives",
      "Enhanced reliability through redundancy",
      "Breakthrough insights from combined AI intelligence"
    ],
    category: "AI Technology"
  },
  {
    icon: Globe,
    title: "Multi-Tenant Architecture",
    description: "Complete data isolation and customization for multiple organizations",
    benefits: [
      "Secure data separation between organizations",
      "Scalable solution for enterprise deployments",
      "Custom branding and configuration per tenant",
      "Cost-effective shared infrastructure"
    ],
    category: "Enterprise"
  }
];

const categories = [
  { name: "AI Technology", color: "#8b5cf6" },
  { name: "Security", color: "#ef4444" },
  { name: "Access Management", color: "#f59e0b" },
  { name: "Analytics", color: "#10b981" },
  { name: "Customization", color: "#06b6d4" },
  { name: "Compliance", color: "#f97316" },
  { name: "Monitoring", color: "#84cc16" },
  { name: "Workflow", color: "#ec4899" }
];

export default function FeaturesBenefitsDialog({ open, onOpenChange }: FeaturesBenefitsDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState("AI Technology");

  const filteredFeatures = features.filter(feature => feature.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="features-benefits-dialog"
        style={{
          maxWidth: '1200px',
          maxHeight: '90vh',
          width: '95vw',
          padding: '0',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          border: 'none'
        }}>
        <div style={{ position: 'relative', height: '100%' }}>
          {/* Header */}
          <DialogHeader style={{
            padding: '32px 40px 24px 40px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '20px 20px 0 0',
            position: 'relative'
          }}>
            <X 
              onClick={() => onOpenChange(false)}
              style={{ 
                position: 'absolute',
                right: '20px',
                top: '20px',
                width: '32px', 
                height: '32px', 
                color: 'white', 
                strokeWidth: 3,
                cursor: 'pointer',
                zIndex: 10
              }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div 
                className="logo-blue-background"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#3b82f6 !important',
                  background: '#3b82f6 !important',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundImage: 'url(/ai-sentinel-logo.png)',
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  filter: 'brightness(0) invert(1)'
                }} />
              </div>
              <div>
                <DialogTitle style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: 'white',
                  margin: '0 0 8px 0'
                }}>
                  AI Sentinel Features & Benefits
                </DialogTitle>
                <p style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: 0,
                  fontWeight: '400'
                }}>
                  Comprehensive enterprise AI governance platform
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Category Filter */}
          <div style={{
            padding: '24px 40px 0 40px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'nowrap',
              paddingBottom: '24px',
              justifyContent: 'space-between'
            }}>
              {categories.map((category) => (
                <Button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  style={{
                    background: selectedCategory === category.name 
                      ? category.color
                      : 'rgba(148, 163, 184, 0.1)',
                    color: selectedCategory === category.name ? 'white' : '#64748b',
                    border: `1px solid ${selectedCategory === category.name ? category.color : '#e2e8f0'}`,
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (selectedCategory !== category.name) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== category.name) {
                      e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)';
                    }
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div style={{
            padding: '32px 40px',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '24px'
            }}>
              {filteredFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                const categoryColor = categories.find(cat => cat.name === feature.category)?.color || '#3b82f6';
                
                return (
                  <div
                    key={index}
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.3s ease',
                      cursor: 'default'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    {/* Feature Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <div style={{
                        background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}25 100%)`,
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <IconComponent style={{ width: '24px', height: '24px', color: categoryColor }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#1e293b',
                            margin: 0
                          }}>
                            {feature.title}
                          </h3>
                          <Badge style={{
                            background: `${categoryColor}15`,
                            color: categoryColor,
                            border: `1px solid ${categoryColor}30`,
                            fontSize: '11px',
                            fontWeight: '500',
                            padding: '2px 8px'
                          }}>
                            {feature.category}
                          </Badge>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          color: '#64748b',
                          margin: 0,
                          lineHeight: '1.5'
                        }}>
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        margin: '0 0 12px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <ArrowRight style={{ width: '14px', height: '14px', color: categoryColor }} />
                        Key Benefits
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div
                            key={benefitIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px'
                            }}
                          >
                            <CheckCircle2 style={{
                              width: '14px',
                              height: '14px',
                              color: '#10b981',
                              marginTop: '2px',
                              flexShrink: 0
                            }} />
                            <span style={{
                              fontSize: '13px',
                              color: '#4b5563',
                              lineHeight: '1.4'
                            }}>
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '24px 40px 32px 40px',
            background: 'rgba(248, 250, 252, 0.8)',
            borderTop: '1px solid #e2e8f0',
            borderRadius: '0 0 20px 20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                Comprehensive AI governance solution for enterprise security and compliance
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}