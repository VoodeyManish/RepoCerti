import React from 'react';
import { SparklesIcon } from './icons';
import { UserRole } from '../types';

interface LoginPageProps {
    onLogin: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-secondary rounded-2xl shadow-2xl text-center">
                <div className="flex flex-col items-center">
                    <SparklesIcon className="h-16 w-16 text-primary" />
                    <h1 className="mt-4 text-4xl font-bold text-text-light dark:text-text-dark">Welcome to RepoCerti</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Your AI-powered document assistant.</p>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">Choose your role to begin</h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => onLogin('student')}
                            className="w-full px-4 py-3 font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                        >
                            I am a Student
                        </button>
                        <button 
                            onClick={() => onLogin('staff')}
                            className="w-full px-4 py-3 font-bold text-text-light dark:text-text-dark bg-gray-200 dark:bg-secondary-light rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                        >
                            I am Staff
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};