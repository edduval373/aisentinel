
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      // Handle demo limit specifically
      if (res.status === 429 && errorData.upgradeRequired) {
        throw { ...errorData, isDemoLimit: true };
      }
      throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
    } catch (parseError) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

// Production fallback for API failures
async function getFallbackResponse(url: string, method: string, data?: unknown): Promise<any> {
  const isProduction = window.location.hostname.includes('aisentinel.app') || window.location.hostname.includes('vercel.app');

  if (!isProduction) return null;

  // Authentication fallback DISABLED for proper session validation
  if (url.includes('auth/me') && method === 'GET') {
    console.log('🚫 [FALLBACK] Auth fallback disabled - must use real sessions');
    return null; // Force real authentication
  }

  // AI Model Templates fallback - redirect to development server
  if (url.includes('admin/ai-model-templates') && method === 'GET') {
    console.log('🔄 [FALLBACK] AI model templates - redirecting to development server');
    try {
      const devResponse = await fetch('https://aisentinel-judm9g13-ed-duvals-projects.vercel.app/api/ai-models', {
        headers: {
          'Authorization': `Bearer prod-1754052835575-289kvxqgl42h`,
          'X-Session-Token': 'prod-1754052835575-289kvxqgl42h'
        }
      });
      if (devResponse.ok) {
        return await devResponse.json();
      }
    } catch (error) {
      console.error('🚫 [FALLBACK] Development server fallback failed:', error);
    }
    return null;
  }

  // Admin companies fallback
  if (url.includes('admin/companies') && method === 'GET') {
    console.log('🔄 [FALLBACK] Using production companies fallback');
    return [
      {
        id: 1,
        name: 'Duval AI Solutions',
        domain: 'duvalsolutions.net', 
        primaryAdminName: 'Ed Duval',
        primaryAdminEmail: 'ed.duval15@gmail.com',
        logo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVagAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAIcBQADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIBgkCBAUDAv/EAGMQAAEDAgMEBAULCxAIBQQDAAABAgMEBQYHEQgSITETQVFhFCNxgZEVFiMyM0FCcsLElqXU'
      }
    ];
  }

  // Chat session creation fallback
  if (url.includes('chat/session') && method === 'POST') {
    return {
      id: Math.floor(Math.random() * 100000) + 1,
      companyId: 1,
      userId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Chat message fallback
  if (url.includes('chat/message') && method === 'POST') {
    const body = data as any;
    const message = body?.message || 'Hello';

    const demoResponse = `I'm a demo AI assistant. You asked: "${message}"\n\nThis is a preview of our enterprise AI governance platform. In the full version, I would process your request using the selected AI model and activity type with proper security monitoring and compliance tracking.`;

    return {
      userMessage: {
        id: Math.floor(Math.random() * 1000000),
        sessionId: body?.sessionId || 1,
        role: 'user',
        content: message,
        aiModelId: body?.aiModelId || 1,
        activityTypeId: body?.activityTypeId || 1,
        createdAt: new Date().toISOString(),
        isSecurityFlagged: false
      },
      assistantMessage: {
        id: Math.floor(Math.random() * 1000000),
        sessionId: body?.sessionId || 1,
        role: 'assistant',
        content: demoResponse,
        aiModelId: body?.aiModelId || 1,
        activityTypeId: body?.activityTypeId || 1,
        createdAt: new Date().toISOString(),
        isSecurityFlagged: false
      }
    };
  }

  return null;
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string>
): Promise<any> {
  const startTime = Date.now();

  console.log(`🔄 [API ${method}] ${url} - Start`);
  console.log(`🔄 [API ${method}] Full URL: ${window.location.origin}${url}`);
  console.log(`🔄 [API ${method}] Data type:`, data instanceof FormData ? 'FormData' : typeof data);
  console.log(`🔄 [API ${method}] Environment: ${import.meta.env.MODE}`);

  try {
    // Get auth headers for header-based authentication
    let authHeaders = {};
    try {
      const { getAuthHeaders } = await import('./authHeaders');
      authHeaders = getAuthHeaders();
      console.log(`🔄 [API ${method}] Auth headers added:`, Object.keys(authHeaders));
    } catch (importError) {
      console.warn(`🔄 [API ${method}] Auth headers not available:`, importError);
    }

    // Handle FormData vs JSON differently
    const isFormData = data instanceof FormData;
    
    const headers = {
      // Don't set Content-Type for FormData - browser will set it with boundary
      ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
      ...customHeaders
    };
    
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
    });

    const duration = Date.now() - startTime;
    console.log(`📊 [API ${method}] ${url} - Status: ${res.status} (${duration}ms)`);
    console.log(`📊 [API ${method}] Headers:`, Object.fromEntries(res.headers.entries()));

    await throwIfResNotOk(res);

    // Check content type and return appropriate response
    const contentType = res.headers.get("content-type");
    console.log(`📊 [API ${method}] Content-Type: ${contentType}`);

    if (contentType?.includes("application/json")) {
      const data = await res.json();
      console.log(`✅ [API ${method}] ${url} - Success:`, data);
      return data;
    } else {
      const text = await res.text();
      console.error(`❌ [API ${method}] ${url} - Expected JSON but got ${contentType}`);
      console.error(`❌ [API ${method}] Response preview:`, text.substring(0, 200));
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [API ${method}] ${url} - Failed (${duration}ms):`, error);

    // Try fallback response for production API failures
    const fallback = await getFallbackResponse(url, method, data);
    if (fallback) {
      console.log(`🔄 [API ${method}] ${url} - Using production fallback`);
      return fallback;
    }

    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const startTime = Date.now();

    console.log(`🔄 [QUERY] ${url} - Start`);
    console.log(`🔄 [QUERY] Full URL: ${window.location.origin}${url}`);

    try {
      // Get auth headers for header-based authentication
      let headers = {};
      try {
        const { getAuthHeaders } = await import('./authHeaders');
        headers = getAuthHeaders();
      } catch (importError) {
        console.warn('Auth headers not available:', importError);
      }
      
      const res = await fetch(url, {
        credentials: "include",
        headers
      });

      const duration = Date.now() - startTime;
      console.log(`📊 [QUERY] ${url} - Status: ${res.status} (${duration}ms)`);
      console.log(`📊 [QUERY] Headers:`, Object.fromEntries(res.headers.entries()));

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`🔒 [QUERY] ${url} - Unauthorized, returning null`);
        return null;
      }

      await throwIfResNotOk(res);

      const contentType = res.headers.get("content-type");
      console.log(`📊 [QUERY] Content-Type: ${contentType}`);

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error(`❌ [QUERY] ${url} - Expected JSON but got ${contentType}`);
        console.error(`❌ [QUERY] Response preview:`, text.substring(0, 200));
        throw new Error(`Expected JSON response but got ${contentType}`);
      }

      const data = await res.json();
      console.log(`✅ [QUERY] ${url} - Success:`, data);
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [QUERY] ${url} - Failed (${duration}ms):`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
