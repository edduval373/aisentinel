import React, { useState } from 'react';
import { Shield, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DemoSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log("[DEMO SIGNUP] Creating demo account for:", email);
      
      const response = await apiRequest('/api/auth/demo-signup', 'POST', {
        email,
        ipAddress: window.location.hostname, // Simple IP tracking
        userAgent: navigator.userAgent
      });

      if (response.success) {
        console.log("[DEMO SIGNUP] Demo account created successfully");
        // Redirect to chat interface
        window.location.href = '/demo';
      } else {
        setError(response.message || 'Failed to create demo account');
      }
    } catch (error: any) {
      console.error("[DEMO SIGNUP] Error:", error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '48px',
        width: '100%',
        maxWidth: '480px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: '#2563eb', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Shield style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              color: '#1e293b',
              margin: 0
            }}>
              AI Sentinel Demo
            </h1>
          </div>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            lineHeight: '1.5',
            margin: 0
          }}>
            Try AI Sentinel with 3 free questions. No verification required.
          </p>
        </div>

        {/* Demo Info Card */}
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 600, 
            color: '#1e40af',
            marginBottom: '12px',
            margin: 0
          }}>
            What you get:
          </h3>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            color: '#475569'
          }}>
            <li style={{ marginBottom: '8px' }}>✓ 3 AI questions with advanced models</li>
            <li style={{ marginBottom: '8px' }}>✓ Real-time content filtering</li>
            <li style={{ marginBottom: '8px' }}>✓ Enterprise security features</li>
            <li style={{ marginBottom: '0' }}>✓ Full admin panel preview</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 500, 
              color: '#374151',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#1f2937',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            style={{
              width: '100%',
              backgroundColor: isLoading || !email.trim() ? '#9ca3af' : '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isLoading || !email.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '20px'
            }}
            onMouseOver={(e) => {
              if (!isLoading && email.trim()) {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading && email.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
          >
            {isLoading ? 'Creating Demo Account...' : 'Start Demo (3 Free Questions)'}
          </button>

          <button
            type="button"
            onClick={handleBack}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#6b7280',
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Home
          </button>
        </form>

        {/* Fine Print */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#64748b',
            lineHeight: '1.4',
            margin: 0
          }}>
            Demo accounts are temporary and track IP addresses for security. 
            After 3 questions, you'll be prompted to start a free 30-day trial.
          </p>
        </div>
      </div>
    </div>
  );
}