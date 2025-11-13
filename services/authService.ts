import { User, UserRole } from '../types';

const USERS_KEY = 'repocerti_users';
const SESSION_KEY = 'repocerti_session';

// --- Helper Functions ---

/**
 * Retrieves all users from localStorage.
 * In a real application, this would be a database call.
 */
const getUsers = (): User[] => {
    try {
        const usersJson = localStorage.getItem(USERS_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
        console.error("Failed to parse users from localStorage", e);
        return [];
    }
};

/**
 * Saves the users array to localStorage.
 */
const saveUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// --- Public API ---

/**
 * Registers a new user.
 * This simulates creating a new user record in a database.
 * @throws {Error} if email is already in use.
 */
export const registerUser = (username: string, email: string, password_DO_NOT_STORE_PLAINTEXT: string, role: UserRole): User => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase();

    if (users.some(user => user.email === normalizedEmail)) {
        throw new Error('An account with this email already exists.');
    }
    
    // In a real application, NEVER store plaintext passwords.
    // Always hash and salt passwords on the server.
    const newUser: User = {
        id: new Date().toISOString() + Math.random(),
        username,
        email: normalizedEmail,
        password_DO_NOT_STORE_PLAINTEXT,
        role,
    };

    users.push(newUser);
    saveUsers(users);

    // Automatically log the user in after registration
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));

    return newUser;
};

/**
 * Logs a user in by checking their credentials.
 * This simulates server-side credential validation.
 * @throws {Error} if credentials are invalid.
 */
export const loginUser = (email: string, password_DO_NOT_STORE_PLAINTEXT: string): User => {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase();
    
    const user = users.find(u => u.email === normalizedEmail);

    // In a real app, you would compare password hashes here.
    if (user && user.password_DO_NOT_STORE_PLAINTEXT === password_DO_NOT_STORE_PLAINTEXT) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return user;
    }

    throw new Error('Invalid email or password.');
};

/**
 * Logs the current user out by clearing their session.
 */
export const logoutUser = (): void => {
    localStorage.removeItem(SESSION_KEY);
};

/**
 * Retrieves the currently logged-in user from the session.
 * This is equivalent to checking a session token.
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
