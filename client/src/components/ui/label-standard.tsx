import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Label: React.FC<LabelProps> = ({ children, style, ...props }) => (
  <label style={{
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    display: 'block',
    marginBottom: '4px',
    ...style
  }} {...props}>
    {children}
  </label>
);

export { Label };