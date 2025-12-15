import * as crypto from 'crypto';
import { config } from '../config/Config';
import { ApiError } from '../Errors';

export type LockUiStyle = 'LOCKED_VISIBLE' | 'HIDE_SHOW_LOCK_ICON';

type SecurityConfig = {
    enabled?: boolean;
    lockUiStyle?: LockUiStyle;
    adminPasswordSalt?: string;
    adminPasswordHash?: string;
};

class SecurityService {
    private _unlocked: boolean = false;

    public getConfig(): Required<Pick<SecurityConfig, 'enabled' | 'lockUiStyle'>> & Pick<SecurityConfig, 'adminPasswordSalt' | 'adminPasswordHash'> {
        const sec = (config.getSection('security') || {}) as SecurityConfig;
        return {
            enabled: !!sec.enabled,
            lockUiStyle: (sec.lockUiStyle || 'LOCKED_VISIBLE') as LockUiStyle,
            adminPasswordSalt: sec.adminPasswordSalt || '',
            adminPasswordHash: sec.adminPasswordHash || ''
        };
    }

    public hasPassword(): boolean {
        const sec = this.getConfig();
        return !!(sec.adminPasswordSalt && sec.adminPasswordHash);
    }

    public isProtectionActive(): boolean {
        const sec = this.getConfig();
        return !!sec.enabled && this.hasPassword();
    }

    public isUnlocked(): boolean {
        if (!this.isProtectionActive()) return true; // treat as "not locked" when protection is inactive
        return this._unlocked;
    }

    public lock(): void {
        this._unlocked = false;
    }

    public unlock(password: unknown): void {
        this.assertPassword(password);
        const sec = this.getConfig();
        if (!sec.adminPasswordSalt || !sec.adminPasswordHash) {
            throw new ApiError(`Security password is not configured.`, undefined, 409);
        }
        const ok = this.verifyPassword(password as string, sec.adminPasswordSalt, sec.adminPasswordHash);
        if (!ok) throw new ApiError(`Invalid admin password.`, undefined, 401);
        this._unlocked = true;
    }

    public setup(password: unknown): void {
        this.assertPassword(password);
        if (this.hasPassword()) throw new ApiError(`Security password is already configured.`, undefined, 409);
        const salt = crypto.randomBytes(16).toString('base64');
        const hash = this.hashPassword(password as string, salt);
        const sec = this.getConfig();
        config.setSection('security', {
            enabled: true,
            lockUiStyle: sec.lockUiStyle,
            adminPasswordSalt: salt,
            adminPasswordHash: hash
        });
        this._unlocked = true;
    }

    // Set/update password using a single password value (no current/new/confirm).
    // If password is blank/undefined, disables security (does not clear existing hash).
    public setPassword(password: unknown): void {
        if (typeof password !== 'string' || password.length === 0) {
            // blank means disable security
            const sec = this.getConfig();
            config.setSection('security', {
                enabled: false,
                lockUiStyle: sec.lockUiStyle,
                adminPasswordSalt: sec.adminPasswordSalt,
                adminPasswordHash: sec.adminPasswordHash
            });
            this._unlocked = false;
            return;
        }
        this.assertPassword(password);
        const salt = crypto.randomBytes(16).toString('base64');
        const hash = this.hashPassword(password as string, salt);
        const sec = this.getConfig();
        config.setSection('security', {
            enabled: true,
            lockUiStyle: sec.lockUiStyle,
            adminPasswordSalt: salt,
            adminPasswordHash: hash
        });
        this._unlocked = true;
    }

    public changePassword(currentPassword: unknown, newPassword: unknown): void {
        this.assertPassword(currentPassword);
        this.assertPassword(newPassword);
        const sec = this.getConfig();
        if (!sec.adminPasswordSalt || !sec.adminPasswordHash) {
            throw new ApiError(`Security password is not configured.`, undefined, 409);
        }
        const ok = this.verifyPassword(currentPassword as string, sec.adminPasswordSalt, sec.adminPasswordHash);
        if (!ok) throw new ApiError(`Invalid admin password.`, undefined, 401);
        const salt = crypto.randomBytes(16).toString('base64');
        const hash = this.hashPassword(newPassword as string, salt);
        config.setSection('security', {
            enabled: sec.enabled, // preserve enabled state
            lockUiStyle: sec.lockUiStyle,
            adminPasswordSalt: salt,
            adminPasswordHash: hash
        });
        this._unlocked = true;
    }

    public disable(currentPassword: unknown): void {
        const sec = this.getConfig();
        config.setSection('security', {
            enabled: false,
            lockUiStyle: sec.lockUiStyle,
            adminPasswordSalt: sec.adminPasswordSalt,
            adminPasswordHash: sec.adminPasswordHash
        });
        this._unlocked = false;
    }

    public requireUnlocked(): void {
        if (!this.isProtectionActive()) return;
        if (!this._unlocked) throw new ApiError(`Admin unlock required.`, undefined, 403);
    }

    private assertPassword(password: unknown): void {
        if (typeof password !== 'string') throw new ApiError(`Password is required.`, undefined, 400);
        if (password.length < 4 || password.length > 20) throw new ApiError(`Password must be 4–20 characters.`, undefined, 400);
    }

    private hashPassword(password: string, saltB64: string): string {
        const salt = Buffer.from(saltB64, 'base64');
        const key = crypto.scryptSync(password, salt, 64);
        return key.toString('base64');
    }

    private verifyPassword(password: string, saltB64: string, hashB64: string): boolean {
        try {
            const expected = Buffer.from(hashB64, 'base64');
            const actual = Buffer.from(this.hashPassword(password, saltB64), 'base64');
            if (expected.length !== actual.length) return false;
            return crypto.timingSafeEqual(expected, actual);
        } catch {
            return false;
        }
    }
}

export const securityService = new SecurityService();


