import React, { useState } from 'react';

interface SelectProps {
  children: React.ReactNode;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

const SelectContext = React.createContext<{
  value: string;
  setValue: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  value: '',
  setValue: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

const Select: React.FC<SelectProps> = ({ children, defaultValue = '', onValueChange }) => {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, setValue: handleValueChange, isOpen, setIsOpen }}>
      <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, style }) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      style={{
        width: '100%',
        height: '40px',
        padding: '0 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        fontSize: '14px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style
      }}
    >
      {children}
      <svg
        style={{
          width: '16px',
          height: '16px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const { isOpen } = React.useContext(SelectContext);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginTop: '4px',
        maxHeight: '200px',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  const { setValue } = React.useContext(SelectContext);

  return (
    <div
      onClick={() => setValue(value)}
      style={{
        padding: '8px 12px',
        fontSize: '14px',
        cursor: 'pointer',
        borderBottom: '1px solid #f3f4f6',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {children}
    </div>
  );
};

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  
  return (
    <span style={{ color: value ? '#111827' : '#9ca3af' }}>
      {value || placeholder}
    </span>
  );
};

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };