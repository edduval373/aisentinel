import React from 'react';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  style?: React.CSSProperties;
}

const Separator: React.FC<SeparatorProps> = ({ orientation = 'horizontal', style }) => {
  const separatorStyles: React.CSSProperties = {
    flexShrink: 0,
    backgroundColor: '#e5e7eb',
    ...(orientation === 'horizontal' 
      ? { height: '1px', width: '100%', margin: '16px 0' }
      : { width: '1px', height: '100%', margin: '0 16px' }
    ),
    ...style
  };

  return <div style={separatorStyles} />;
};

export { Separator };