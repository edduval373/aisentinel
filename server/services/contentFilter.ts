interface FilterResult {
  blocked: boolean;
  reason?: string;
  flags: string[];
}

class ContentFilter {
  private readonly piiPatterns = [
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
    /\b\d{3}\s\d{2}\s\d{4}\b/g,
    /\b\d{9}\b/g,
    
    // Credit Card Numbers
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g,
    /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,
    
    // Phone Numbers
    /\b\(\d{3}\)\s?\d{3}-\d{4}\b/g,
    /\b\d{3}-\d{3}-\d{4}\b/g,
    /\b\d{3}\.\d{3}\.\d{4}\b/g,
    
    // Email Addresses (basic pattern)
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    
    // IP Addresses
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    
    // Common ID patterns
    /\b[A-Z]{2}\d{6,}\b/g,
    /\b\d{6,12}\b/g,
  ];

  private readonly financialKeywords = [
    'revenue', 'profit', 'loss', 'earnings', 'salary', 'wage', 'income',
    'budget', 'cost', 'expense', 'margin', 'ebitda', 'roi', 'cash flow',
    'quarterly', 'annual report', 'financial statement', 'balance sheet',
    'p&l', 'income statement', 'accounts receivable', 'accounts payable',
    'depreciation', 'amortization', 'tax', 'dividend', 'share price',
    'market cap', 'valuation', 'ipo', 'merger', 'acquisition', 'debt',
    'equity', 'investment', 'portfolio', 'asset', 'liability'
  ];

  private readonly sensitiveKeywords = [
    'confidential', 'proprietary', 'trade secret', 'internal only',
    'restricted', 'classified', 'private', 'sensitive', 'privileged',
    'nda', 'non-disclosure', 'confidentiality', 'password', 'login',
    'credentials', 'api key', 'token', 'secret', 'private key',
    'customer data', 'personal information', 'employee data'
  ];

  async filterMessage(message: string): Promise<FilterResult> {
    const flags: string[] = [];
    let blocked = false;
    let reason = '';

    // Validate input
    if (!message || typeof message !== 'string') {
      return { blocked: false, flags: [], reason: '' };
    }

    // Check for PII patterns
    for (const pattern of this.piiPatterns) {
      if (pattern.test(message)) {
        flags.push('PII_DETECTED');
        blocked = true;
        reason = 'Personal Identifiable Information (PII) detected';
        break;
      }
    }

    // Check for financial keywords
    const lowerMessage = message.toLowerCase();
    for (const keyword of this.financialKeywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        flags.push('FINANCIAL_DATA');
        blocked = true;
        reason = 'Financial data detected';
        break;
      }
    }

    // Check for sensitive keywords
    for (const keyword of this.sensitiveKeywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        flags.push('SENSITIVE_DATA');
        blocked = true;
        reason = 'Sensitive information detected';
        break;
      }
    }

    // Check for potential code with sensitive information
    if (this.containsSensitiveCode(message)) {
      flags.push('SENSITIVE_CODE');
      blocked = true;
      reason = 'Potentially sensitive code detected';
    }

    // Check for URLs that might contain sensitive information
    if (this.containsSensitiveUrls(message)) {
      flags.push('SENSITIVE_URL');
      blocked = true;
      reason = 'Potentially sensitive URL detected';
    }

    // Additional checks for data leakage
    if (this.containsDataLeakage(message)) {
      flags.push('DATA_LEAKAGE');
      blocked = true;
      reason = 'Potential data leakage detected';
    }

    return {
      blocked,
      reason,
      flags
    };
  }

  private containsSensitiveCode(message: string): boolean {
    const sensitiveCodePatterns = [
      /password\s*[:=]\s*['""][^'""]+['"]/gi,
      /api_key\s*[:=]\s*['""][^'""]+['"]/gi,
      /secret\s*[:=]\s*['""][^'""]+['"]/gi,
      /token\s*[:=]\s*['""][^'""]+['"]/gi,
      /private_key\s*[:=]\s*['""][^'""]+['"]/gi,
      /connection_string\s*[:=]\s*['""][^'""]+['"]/gi,
      /database_url\s*[:=]\s*['""][^'""]+['"]/gi,
    ];

    return sensitiveCodePatterns.some(pattern => pattern.test(message));
  }

  private containsSensitiveUrls(message: string): boolean {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = message.match(urlPattern) || [];
    
    const sensitiveUrlPatterns = [
      /internal/i,
      /private/i,
      /staging/i,
      /dev/i,
      /test/i,
      /admin/i,
      /\.local/i,
      /localhost/i,
      /127\.0\.0\.1/i,
      /192\.168\./i,
      /10\./i,
    ];

    return urls.some(url => 
      sensitiveUrlPatterns.some(pattern => pattern.test(url))
    );
  }

  private containsDataLeakage(message: string): boolean {
    // Check for structured data that might be sensitive
    const structuredDataPatterns = [
      /\{[^}]*["'](?:password|key|secret|token)['"]/gi,
      /\[[^\]]*["'](?:password|key|secret|token)['"]/gi,
      /^\s*\w+\s*[:=]\s*['""][^'""]+['""].*$/gm, // Key-value pairs
    ];

    return structuredDataPatterns.some(pattern => pattern.test(message));
  }
}

export const contentFilter = new ContentFilter();
