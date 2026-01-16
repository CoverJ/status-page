/**
 * Authentication utilities.
 */

export {
	hashPassword,
	type PasswordValidationResult,
	validatePasswordStrength,
	verifyPassword,
} from "./password";

export {
	clearSessionCookie,
	createSession,
	destroySession,
	generateSessionId,
	generateUserId,
	getSessionCookie,
	getSessionExpiry,
	refreshSession,
	setSessionCookie,
	validateSession,
} from "./session";

export {
	type AuthContext,
	type AuthResult,
	forbiddenResponse,
	getCurrentUser,
	hasPageAccess,
	hasPageRole,
	refreshSessionOnActivity,
	unauthorizedResponse,
} from "./guards";
