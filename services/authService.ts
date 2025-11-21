
import { User, UserRole, StaffDesignation } from '../types';
import { dbCreateUser, dbGetUserByEmail } from './databaseService';

const SESSION_KEY = 'repocerti_session';

// --- Public API ---

/**
 * Registers a new user.
 */
export const registerUser = (
    username: string, 
    email: string, 
    password_DO_NOT_STORE_PLAINTEXT: string, 
    role: UserRole,
    designation?: StaffDesignation
): User => {
    
    const normalizedEmail = email.toLowerCase();

    const newUser: User = {
        id: Date.now().toString(),
        username,
        email: normalizedEmail,
        password_DO_NOT_STORE_PLAINTEXT,
        role,
        designation: role === 'staff' ? designation : undefined
    };

    try {
        dbCreateUser(newUser);
    } catch (e: any) {
        throw new Error(e.message || 'Registration failed');
    }

    // Automatically log the user in after registration
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

    return newUser;
};

/**
 * Logs a user in.
 */
export const loginUser = (email: string, password_DO_NOT_STORE_PLAINTEXT: string): User => {
    const normalizedEmail = email.toLowerCase();
    const user = dbGetUserByEmail(normalizedEmail);

    // In a real app, you would compare password hashes here.
    if (user && user.password_DO_NOT_STORE_PLAINTEXT === password_DO_NOT_STORE_PLAINTEXT) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    }

    throw new Error('Invalid email or password.');
};

/**
 * Logs the current user out.
 */
export const logoutUser = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

/**
 * Retrieves the currently logged-in user from the session.
 */
export const getCurrentUser = (): User | null => {
    try {
        const sessionJson = localStorage.getItem(SESSION_KEY);
        return sessionJson ? JSON.parse(sessionJson) : null;
    } catch (e) {
        console.error("Failed to parse session from localStorage", e);
        return null;
    }
};
