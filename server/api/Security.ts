import * as express from "express";
import { securityService } from "../security/SecurityService";

export class SecurityRoute {
    public static initRoutes(app: express.Application) {
        app.get('/security/status', (req, res, next) => {
            try {
                const sec = securityService.getConfig();
                return res.status(200).send({
                    enabled: !!sec.enabled,
                    lockUiStyle: sec.lockUiStyle,
                    hasPassword: securityService.hasPassword(),
                    unlocked: securityService.isUnlocked()
                });
            } catch (err) { next(err); }
        });

        // One-time setup: only allowed when password is not configured.
        app.post('/security/setup', (req, res, next) => {
            try {
                securityService.setup(req.body?.password);
                const sec = securityService.getConfig();
                return res.status(200).send({
                    enabled: !!sec.enabled,
                    lockUiStyle: sec.lockUiStyle,
                    hasPassword: securityService.hasPassword(),
                    unlocked: securityService.isUnlocked()
                });
            } catch (err) { next(err); }
        });

        // Set/update password (single field) and enable security.
        // If password is blank, disables security.
        app.post('/security/setPassword', (req, res, next) => {
            try {
                securityService.setPassword(req.body?.password);
                const sec = securityService.getConfig();
                return res.status(200).send({
                    enabled: !!sec.enabled,
                    lockUiStyle: sec.lockUiStyle,
                    hasPassword: securityService.hasPassword(),
                    unlocked: securityService.isUnlocked()
                });
            } catch (err) { next(err); }
        });

        app.post('/security/unlock', (req, res, next) => {
            try {
                securityService.unlock(req.body?.password);
                const sec = securityService.getConfig();
                return res.status(200).send({
                    enabled: !!sec.enabled,
                    lockUiStyle: sec.lockUiStyle,
                    hasPassword: securityService.hasPassword(),
                    unlocked: securityService.isUnlocked()
                });
            } catch (err) { next(err); }
        });

        app.post('/security/lock', (req, res, next) => {
            try {
                securityService.lock();
                const sec = securityService.getConfig();
                return res.status(200).send({
                    enabled: !!sec.enabled,
                    lockUiStyle: sec.lockUiStyle,
                    hasPassword: securityService.hasPassword(),
                    unlocked: securityService.isUnlocked()
                });
            } catch (err) { next(err); }
        });

        app.post('/security/changePassword', (req, res, next) => {
            try {
                securityService.changePassword(req.body?.currentPassword, req.body?.newPassword);
                const sec = securityService.getConfig();
                return res.status(200).send({
                    enabled: !!sec.enabled,
                    lockUiStyle: sec.lockUiStyle,
                    hasPassword: securityService.hasPassword(),
                    unlocked: securityService.isUnlocked()
                });
            } catch (err) { next(err); }
        });

        // Disable security (does NOT clear password hash; simply sets security.enabled=false)
        app.post('/security/disable', (req, res, next) => {
            try {
                securityService.disable(req.body?.password);
                const sec = securityService.getConfig();
                return res.status(200).send({
                    enabled: !!sec.enabled,
                    lockUiStyle: sec.lockUiStyle,
                    hasPassword: securityService.hasPassword(),
                    unlocked: securityService.isUnlocked()
                });
            } catch (err) { next(err); }
        });
    }
}


