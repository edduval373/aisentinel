import React, { useState } from 'react';

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

const Switch: React.FC<SwitchProps> = ({ 
  checked: controlledChecked, 
  defaultChecked = false, 
  onCheckedChange, 
  disabled = false,
  style,
  id
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleClick = () => {
    if (disabled) return;
    
    const newChecked = !isChecked;
    if (controlledChecked === undefined) {
      setInternalChecked(newChecked);
    }
    onCheckedChange?.(newChecked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      onClick={handleClick}
      disabled={disabled}
      id={id}
      style={{
        width: '44px',
        height: '24px',
        backgroundColor: isChecked ? '#3b82f6' : '#d1d5db',
        border: 'none',
        borderRadius: '12px',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
        outline: 'none',
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: isChecked ? '22px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      />
    </button>
  );
};

export { Switch };