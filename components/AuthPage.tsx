import React, { useState } from 'react';
import { SparklesIcon } from './icons';
import { User, UserRole } from '../types';
import { loginUser, registerUser } from '../services/authService';

interface AuthPageProps {
    onLoginSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<UserRole>('student');

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setUsername('');
        setRole('student');
        setError(null);
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let user;
            if (isLoginView) {
                user = loginUser(email, password);
            } else {
                if (!username) {
                  throw new Error("Username is required for signup.");
                }
                user = registerUser(username, email, password, role);
            }
            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-secondary rounded-2xl shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <SparklesIcon className="h-12 w-12 text-primary" />
                    <h1 className="mt-4 text-3xl font-bold text-text-light dark:text-text-dark">
                        {isLoginView ? 'Welcome Back!' : 'Create Your Account'}
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                       {isLoginView ? 'Log in to access your dashboard.' : 'Join RepoCerti today.'}
                    </p>
                </div>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {!isLoginView && (
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-primary focus:border-primary"
                                placeholder="John Doe"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-primary focus:border-primary"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border rounded-md bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-primary focus:border-primary"
                            placeholder="••••••••"
                        />
                    </div>
                    {!isLoginView && (
                         <div>
                            <label className="block text-sm font-medium text-left text-gray-700 dark:text-gray-300">I am a</label>
                            <div className="mt-2 flex gap-4">
                                <label className="flex items-center">
                                    <input type="radio" value="student" checked={role === 'student'} onChange={() => setRole('student')} className="form-radio text-primary focus:ring-primary"/>
                                    <span className="ml-2 text-text-light dark:text-text-dark">Student</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="staff" checked={role === 'staff'} onChange={() => setRole('staff')} className="form-radio text-primary focus:ring-primary"/>
                                    <span className="ml-2 text-text-light dark:text-text-dark">Staff</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                        >
                            {loading ? 'Processing...' : (isLoginView ? 'Log In' : 'Sign Up')}
                        </button>
                    </div>
                </form>
                
                <div className="text-center">
                    <button onClick={toggleView} className="text-sm font-medium text-primary hover:underline focus:outline-none">
                        {isLoginView ? 'Don\'t have an account? Sign up' : 'Already have an account? Log in'}
                    </button>
                </div>
            </div>
        </div>
    );
};
