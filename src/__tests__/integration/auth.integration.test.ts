/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
import { GET, POST } from '@/app/api/auth/route';

// Mock NextRequest for testing
const MockNextRequest = class {
  constructor(url: string, options: Record<string, unknown> = {}) {
    this.url = url;
    this.method = (options.method as string) || 'GET';
    this.body = options.body;
    this.headers = new Map((options.headers as Array<[string, string]>) || []);
  }
  url: string;
  method: string;
  body: unknown;
  headers: Map<string, string>;
};

// Mock NextRequest globally
(global as any).NextRequest = MockNextRequest;

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    JWT_SECRET_KEY: 'test-jwt-secret',
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: 'password123'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test_client_123',
                name: 'Test Hospital',
                department: 'Healthcare',
                api_key: 'test_api_key_123',
                voice_calls: true,
                data_export: true,
                analytics: true
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}));

describe('/api/auth', () => {
  describe('GET /api/auth', () => {
    it('should return healthy status', async () => {
      const response = await GET();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        status: 'healthy',
        service: 'hana-voice-api',
        version: '1.0.0',
        timestamp: expect.any(String),
        message: 'Application is running successfully'
      });
    });
  });

  describe('POST /api/auth', () => {
    it('should authenticate valid client credentials', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'authenticate',
          clientId: 'test_client_123',
          apiKey: 'test_api_key_123'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        authenticated: true,
        client: {
          id: 'test_client_123',
          name: 'Test Hospital',
          department: 'Healthcare',
          permissions: {
            voice_calls: true,
            data_export: true,
            analytics: true
          }
        },
        message: 'Client authentication successful'
      });
    });

    it('should reject invalid client credentials', async () => {
      // Mock failed authentication
      const mockSupabaseClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Invalid credentials' }
                }))
              }))
            }))
          }))
        }))
      };

      jest.mocked(require('@supabase/supabase-js').createClient).mockReturnValueOnce(mockSupabaseClient);

      const request = new MockNextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'authenticate',
          clientId: 'invalid_client',
          apiKey: 'invalid_key'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Invalid client credentials');
    });

    it('should authenticate valid admin credentials', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          username: 'admin',
          password: 'password123'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Admin login successful',
        user: { username: 'admin' }
      });

      // Check for auth cookie in response
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('auth-token');
    });

    it('should reject invalid admin credentials', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          username: 'admin',
          password: 'wrong_password'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Invalid admin credentials');
    });

    it('should handle logout', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'logout'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        success: true,
        message: 'Logout successful'
      });

      // Check for cleared cookie
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('auth-token=;');
    });

    it('should reject invalid request data', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'authenticate'
          // Missing required fields
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid request data');
    });

    it('should reject unsupported actions', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'unsupported_action'
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Invalid action');
    });
  });
});
