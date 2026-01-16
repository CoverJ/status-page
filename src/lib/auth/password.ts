/**
 * Password hashing and verification utilities using Web Crypto API.
 * Uses PBKDF2 with 100,000 iterations and SHA-256.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // 128 bits
const HASH_LENGTH = 32; // 256 bits

/**
 * Generates a cryptographically secure random salt.
 */
function generateSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Converts a Uint8Array to a hex string.
 */
function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

/**
 * Converts a hex string to a Uint8Array.
 */
function fromHex(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}

/**
 * Derives a key from a password using PBKDF2.
 */
async function deriveKey(
	password: string,
	salt: Uint8Array,
): Promise<Uint8Array> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		HASH_LENGTH * 8, // bits
	);

	return new Uint8Array(derivedBits);
}

/**
 * Hashes a password using PBKDF2 with SHA-256.
 * Returns a string in the format: `salt:hash` (both hex-encoded).
 *
 * @param password - The plain text password to hash
 * @returns The hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
	const salt = generateSalt();
	const hash = await deriveKey(password, salt);
	return `${toHex(salt)}:${toHex(hash)}`;
}

/**
 * Verifies a password against a stored hash.
 *
 * @param password - The plain text password to verify
 * @param storedHash - The stored hash string (salt:hash format)
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	const [saltHex, hashHex] = storedHash.split(":");
	if (!saltHex || !hashHex) {
		return false;
	}

	const salt = fromHex(saltHex);
	const storedHashBytes = fromHex(hashHex);
	const derivedHash = await deriveKey(password, salt);

	// Constant-time comparison to prevent timing attacks
	if (derivedHash.length !== storedHashBytes.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < derivedHash.length; i++) {
		result |= derivedHash[i] ^ storedHashBytes[i];
	}
	return result === 0;
}

/**
 * Password strength validation result.
 */
export interface PasswordValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Validates password strength according to complexity rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 *
 * @param password - The password to validate
 * @returns Validation result with errors if invalid
 */
export function validatePasswordStrength(
	password: string,
): PasswordValidationResult {
	const errors: string[] = [];

	if (password.length < 8) {
		errors.push("Password must be at least 8 characters long");
	}

	if (!/[A-Z]/.test(password)) {
		errors.push("Password must contain at least one uppercase letter");
	}

	if (!/[a-z]/.test(password)) {
		errors.push("Password must contain at least one lowercase letter");
	}

	if (!/[0-9]/.test(password)) {
		errors.push("Password must contain at least one digit");
	}

	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
		errors.push("Password must contain at least one special character");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
