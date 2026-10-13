// Authentication Provider Abstraction
// Strict separation between Production Authentication and Development/Demo Authentication.
// Defense-in-depth: Production mode can NEVER silently authenticate demo accounts.

import { userRepository } from '@/lib/db/repositories/user.repository';
import { SecurityActor } from '@/lib/security/authorization';
import { AuthenticationError } from './session';
export { AuthenticationError };

export interface AuthIdentity {
  userId: string;
  providerType: 'PRODUCTION' | 'DEMO';
  issuedAt?: number;
  expiresAt?: number;
}

export interface IAuthenticationProvider {
  authenticate(req: Request): Promise<AuthIdentity>;
}

export class ProductionAuthProvider implements IAuthenticationProvider {
  async authenticate(req: Request): Promise<AuthIdentity> {
    // 1. Extract session token from Authorization: Bearer or secure httpOnly cookie
    let token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/elkyno_session=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]).trim();
      }
    }

    if (!token) {
      throw new AuthenticationError('Token otentikasi tidak ditemukan. Header Authorization atau cookie sesi wajib disertakan.');
    }

    // In production, demo token prefixes are strictly disallowed
    if (token.startsWith('user-superadmin') || token.startsWith('user-admin-') || token.startsWith('user-employee')) {
      if (process.env.AUTH_MODE === 'production' || process.env.NODE_ENV === 'production') {
        throw new AuthenticationError('Akses ditolak: Penggunaan kredensial demo dilarang di lingkungan produksi.');
      }
    }

    // Parse / verify token format
    // Session token structure: user_id:random_hash:expiry
    const parts = token.split(':');
    const userId = parts[0];

    if (!userId) {
      throw new AuthenticationError('Format token sesi tidak valid.');
    }

    return {
      userId,
      providerType: 'PRODUCTION',
    };
  }
}

export class DemoAuthProvider implements IAuthenticationProvider {
  private allowedDemoUserIds = new Set([
    'user-superadmin',
    'user-admin-pt',
    'user-admin-project',
    'user-employee',
  ]);

  async authenticate(req: Request): Promise<AuthIdentity> {
    // Explicit production safeguard
    if (process.env.AUTH_MODE === 'production' || process.env.NODE_ENV === 'production') {
      throw new AuthenticationError('Akses ditolak: Demo Authentication Provider dinonaktifkan di lingkungan produksi.');
    }

    let sessionId =
      req.headers.get('x-session-id') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      '';

    if (!sessionId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/elkyno_session=([^;]+)/);
      if (match) {
        sessionId = decodeURIComponent(match[1]);
      }
    }

    sessionId = sessionId.trim();

    if (!sessionId) {
      throw new AuthenticationError('Autentikasi gagal: Token sesi tidak disertakan.');
    }

    if (!this.allowedDemoUserIds.has(sessionId)) {
      throw new AuthenticationError('Autentikasi gagal: Sesi tidak valid atau telah berakhir.');
    }

    return {
      userId: sessionId,
      providerType: 'DEMO',
    };
  }
}

export class CompositeAuthenticationManager {
  private prodProvider = new ProductionAuthProvider();
  private demoProvider = new DemoAuthProvider();

  async authenticateRequest(req: Request): Promise<SecurityActor> {
    const isProduction = process.env.AUTH_MODE === 'production' || process.env.NODE_ENV === 'production';
    let identity: AuthIdentity | null = null;

    if (isProduction) {
      identity = await this.prodProvider.authenticate(req);
    } else {
      // In development, try demo provider first if x-session-id is used, then production
      const sessionId = req.headers.get('x-session-id');
      if (sessionId && sessionId.startsWith('user-')) {
        identity = await this.demoProvider.authenticate(req);
      } else {
        try {
          identity = await this.prodProvider.authenticate(req);
        } catch (err) {
          // If prod provider fails, try demo provider before rejecting
          identity = await this.demoProvider.authenticate(req);
        }
      }
    }

    if (!identity || !identity.userId) {
      throw new AuthenticationError('Autentikasi gagal: Identitas pengguna tidak dapat diverifikasi.');
    }

    // Resolve authoritative SecurityActor from database / trusted repository
    const actor = await userRepository.findSecurityActorById(identity.userId);

    if (!actor) {
      throw new AuthenticationError('Autentikasi gagal: Pengguna tidak terdaftar atau telah dinonaktifkan.');
    }

    return actor;
  }
}

export const authManager = new CompositeAuthenticationManager();
