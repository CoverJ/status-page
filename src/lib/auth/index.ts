/**
 * Authentication utilities.
 */

export {
	hashPassword,
	verifyPassword,
	validatePasswordStrength,
	type PasswordValidationResult,
} from "./password";

export {
	generateSessionId,
	generateUserId,
	getSessionExpiry,
	createSession,
	setSessionCookie,
	getSessionCookie,
	clearSessionCookie,
	validateSession,
	destroySession,
} from "./session";
