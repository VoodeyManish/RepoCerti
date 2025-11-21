
import { User, StoredFile, UserRole, StaffDesignation } from '../types';

const USERS_KEY = 'repocerti_db_users';
const FILES_KEY = 'repocerti_db_files';

// --- Database Core (LocalStorage Wrapper) ---

const getDBUsers = (): User[] => {
    try {
        const data = localStorage.getItem(USERS_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

const saveDBUsers = (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const getDBFiles = (): StoredFile[] => {
    try {
        const data = localStorage.getItem(FILES_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

const saveDBFiles = (files: StoredFile[]) => localStorage.setItem(FILES_KEY, JSON.stringify(files));

// --- User Operations ---

export const dbCreateUser = (user: User): User => {
    const users = getDBUsers();
    if (users.some(u => u.email === user.email)) {
        throw new Error('User already exists');
    }
    users.push(user);
    saveDBUsers(users);
    return user;
};

export const dbGetUserByEmail = (email: string): User | undefined => {
    const users = getDBUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

// --- File Operations ---

export const dbSaveFile = (file: Omit<StoredFile, 'id' | 'createdAt'>): StoredFile => {
    const files = getDBFiles();
    const newFile: StoredFile = {
        ...file,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
    };
    files.push(newFile);
    saveDBFiles(files);
    return newFile;
};

/**
 * Retrieves files based on the viewer's hierarchy.
 * 
 * Hierarchy Rules:
 * - Principal: Sees All (Deans, HODs, Students)
 * - Dean: Sees HODs and Students
 * - HOD: Sees Students
 * - Student: Sees only their own
 */
export const dbGetFilesForUser = (viewer: User): StoredFile[] => {
    const allFiles = getDBFiles();

    // If student, only see own files
    if (viewer.role === 'student') {
        return allFiles.filter(f => f.userId === viewer.id);
    }

    // If Staff, filter based on designation
    if (viewer.role === 'staff') {
        const designation = viewer.designation;

        return allFiles.filter(file => {
            // Always see own files
            if (file.userId === viewer.id) return true;

            const ownerRole = file.userRole;
            const ownerDesig = file.userDesignation;

            if (designation === 'principal') {
                // Principal sees Dean, HOD, Student
                return ownerRole === 'student' || ownerDesig === 'dean' || ownerDesig === 'hod';
            }

            if (designation === 'dean') {
                // Dean sees HOD, Student (Not Principal, Not other Deans usually, but let's say downward only)
                return ownerRole === 'student' || ownerDesig === 'hod';
            }

            if (designation === 'hod') {
                // HOD sees Student
                return ownerRole === 'student';
            }

            return false;
        });
    }

    return [];
};
