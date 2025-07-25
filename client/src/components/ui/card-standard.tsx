import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, style }) => (
  <div style={{
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    ...style
  }}>
    {children}
  </div>
);

const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <div style={{
    padding: '24px 24px 16px 24px',
    ...style
  }}>
    {children}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <div style={{
    padding: '24px',
    ...style
  }}>
    {children}
  </div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => (
  <h3 style={{
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0',
    ...style
  }}>
    {children}
  </h3>
);

const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => (
  <p style={{
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
    lineHeight: '1.5',
    ...style
  }}>
    {children}
  </p>
);

export { Card, CardHeader, CardContent, CardTitle, CardDescription };