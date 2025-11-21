
import React, { useEffect, useState } from 'react';
import { dbGetFilesForUser } from '../services/databaseService';
import { getCurrentUser } from '../services/authService';
import { StoredFile } from '../types';
import { DownloadIcon } from './icons';
import { jsPDF } from "jspdf";

export const FileRepository: React.FC = () => {
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [currentUser, setCurrentUser] = useState(getCurrentUser());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
        if (user) {
            const userFiles = dbGetFilesForUser(user);
            setFiles(userFiles);
        }
    }, []);

    const downloadFile = (file: StoredFile) => {
        // Simple reconstruction for download (Reusing logic from ReportGenerator roughly)
        if (file.type === 'report') {
            const doc = new jsPDF();
            const margin = 20;
            doc.setFontSize(20);
            doc.text(file.title, margin, 20);
            
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(file.content, 170);
            let cursorY = 35;

             // Add Text
             for (let i = 0; i < splitText.length; i++) {
                if (cursorY > 280) {
                    doc.addPage();
                    cursorY = margin;
                }
                doc.text(splitText[i], margin, cursorY);
                cursorY += 7;
            }

            // Add Images
            if (file.images && file.images.length > 0) {
                doc.addPage();
                doc.text("Attached Images", margin, 20);
                cursorY = 30;
                file.images.forEach(img => {
                     try {
                        const format = img.mimeType.split('/')[1].toUpperCase();
                        const safeFormat = ['JPEG', 'PNG', 'WEBP'].includes(format) ? format : 'JPEG';
                        doc.addImage(img.base64, safeFormat, margin, cursorY, 100, 100);
                        cursorY += 110;
                     } catch(e) { console.error("Image add failed", e)}
                });
            }
            doc.save(`${file.title.replace(/\s+/g, '_')}_${file.username}.pdf`);
        }
    };

    const filteredFiles = files.filter(f => 
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white dark:bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">File Repository</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Viewing as: <span className="font-bold uppercase">{currentUser?.designation || currentUser?.role}</span>
                    </p>
                </div>
                <input 
                    type="text" 
                    placeholder="Search by title or student..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-lg bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none w-full md:w-64"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-secondary-light text-xs uppercase text-text-light dark:text-text-dark">
                        <tr>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Created By</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                            <tr key={file.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-secondary-light">
                                <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">{file.title}</td>
                                <td className="px-6 py-4 capitalize">{file.type}</td>
                                <td className="px-6 py-4">{file.username}</td>
                                <td className="px-6 py-4 capitalize">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        file.userRole === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                    }`}>
                                        {file.userDesignation || file.userRole}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{new Date(file.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <button 
                                        onClick={() => downloadFile(file)}
                                        className="text-primary hover:text-primary-dark font-semibold flex items-center gap-1"
                                    >
                                        <DownloadIcon className="w-4 h-4" /> Download
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No files found. 
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
