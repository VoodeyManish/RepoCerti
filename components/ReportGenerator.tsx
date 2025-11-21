
import React, { useState, useCallback } from 'react';
import { generateReportSection, improveReportText } from '../services/geminiService';
import { ReportVersion } from '../types';
import { SparklesIcon, SaveIcon, UploadIcon, DownloadIcon } from './icons';
import { jsPDF } from "jspdf";
import { dbSaveFile } from '../services/databaseService';
import { getCurrentUser } from '../services/authService';

const ActionButton: React.FC<{
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, disabled, children, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-background-dark ${className || ''}`}
    >
        {children}
    </button>
);

interface ReportImage {
    file: File;
    previewUrl: string;
    base64: string;
}

export const ReportGenerator: React.FC = () => {
    const [reportText, setReportText] = useState<string>('');
    const [topic, setTopic] = useState<string>('');
    const [structure, setStructure] = useState<string>('');
    const [versions, setVersions] = useState<ReportVersion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [images, setImages] = useState<ReportImage[]>([]);

    const handleGenerate = useCallback(async () => {
        if (!topic) {
            setError('Please enter a topic to generate a report.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const newContent = await generateReportSection(topic, structure);
            setReportText(newContent);
        } catch (err) {
            setError('Failed to generate report. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [topic, structure]);

    const handleImprove = useCallback(async () => {
        if (!reportText) {
            setError('There is no text to improve.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const improvedContent = await improveReportText(reportText);
            setReportText(improvedContent);
        } catch (err) {
            setError('Failed to improve text. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [reportText]);

    const saveVersion = () => {
        if (!reportText.trim()) return;
        const newVersion: ReportVersion = {
            content: reportText,
            timestamp: new Date(),
        };
        setVersions([newVersion, ...versions]);
    };
    
    const saveToDatabase = () => {
        const user = getCurrentUser();
        if (!user || !reportText.trim()) return;
        
        try {
            dbSaveFile({
                userId: user.id,
                username: user.username,
                userRole: user.role,
                userDesignation: user.designation,
                title: topic || 'Untitled Report',
                type: 'report',
                content: reportText,
                images: images.map(img => ({ base64: img.base64, mimeType: img.file.type }))
            });
            setSuccessMsg("Report saved to database successfully! Staff can now view it.");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError("Failed to save to database.");
        }
    };

    const loadVersion = (content: string) => {
        setReportText(content);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: ReportImage[] = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            
            const p = new Promise<ReportImage>((resolve) => {
                reader.onload = () => {
                   resolve({
                       file,
                       previewUrl: URL.createObjectURL(file),
                       base64: reader.result as string
                   });
                };
                reader.readAsDataURL(file);
            });
            newImages.push(await p);
        }

        setImages(prev => [...prev, ...newImages]);
        // Reset input
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].previewUrl);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxLineWidth = pageWidth - (margin * 2);

        doc.setFontSize(20);
        doc.text(topic || 'Report', margin, 20);
        
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(reportText, maxLineWidth);
        
        let cursorY = 35;

        // Add Text
        for (let i = 0; i < splitText.length; i++) {
            if (cursorY > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
            }
            doc.text(splitText[i], margin, cursorY);
            cursorY += 7;
        }

        // Add Images
        if (images.length > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text("Attached Images", margin, 20);
            cursorY = 30;

            images.forEach((img) => {
                const imgProps = doc.getImageProperties(img.base64);
                const ratio = imgProps.height / imgProps.width;
                const imgWidth = maxLineWidth;
                const imgHeight = imgWidth * ratio;

                if (cursorY + imgHeight > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }

                const format = img.file.type.split('/')[1].toUpperCase();
                // jsPDF supports JPEG, PNG, WEBP. Fallback to JPEG if unknown.
                const safeFormat = ['JPEG', 'PNG', 'WEBP'].includes(format) ? format : 'JPEG';

                doc.addImage(img.base64, safeFormat, margin, cursorY, imgWidth, imgHeight);
                cursorY += imgHeight + 10;
            });
        }

        doc.save(`${topic || 'report'}.pdf`);
    };

    const downloadDoc = () => {
        let imageContent = '';
        images.forEach(img => {
            imageContent += `<br/><img src="${img.base64}" style="max-width: 100%; height: auto;" /><br/>`;
        });

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${topic}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                    h1, h2, h3 { color: #333; }
                    p { margin-bottom: 10px; line-height: 1.5; }
                </style>
            </head>
            <body>
                <h1>${topic}</h1>
                <div>
                    ${reportText.replace(/\n/g, '<br/>')}
                </div>
                ${images.length > 0 ? '<h2>Attached Images</h2>' + imageContent : ''}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${topic || 'report'}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Configuration Section */}
                <div className="bg-white dark:bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Report Configuration</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Report Topic
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="E.g., The Impact of AI on Education"
                                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Structure / Headings (Optional)
                            </label>
                            <textarea
                                value={structure}
                                onChange={(e) => setStructure(e.target.value)}
                                placeholder="Introduction, Key Findings, Challenges, Conclusion..."
                                className="w-full p-2 h-24 border rounded-lg bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none resize-y"
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-500 mt-1">Define the sections you want the AI to cover.</p>
                        </div>
                        <div className="flex justify-end">
                            <ActionButton onClick={handleGenerate} disabled={isLoading || !topic}>
                                <SparklesIcon className="w-5 h-5" />
                                {isLoading ? 'Generating...' : 'Generate Report'}
                            </ActionButton>
                        </div>
                    </div>
                </div>

                {/* Editor Section */}
                <div className="bg-white dark:bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-xl font-bold">Content Editor</h2>
                         <div className="flex gap-2">
                            <ActionButton onClick={handleImprove} disabled={isLoading || !reportText}>
                                <SparklesIcon className="w-4 h-4" />
                                Improve
                            </ActionButton>
                             <ActionButton onClick={saveVersion} disabled={isLoading || !reportText}>
                                <SaveIcon className="w-4 h-4" />
                                Snapshot
                            </ActionButton>
                         </div>
                    </div>
                   
                    <textarea
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        placeholder="Generated report content will appear here..."
                        className="w-full h-96 p-4 border rounded-lg bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none resize-y font-mono text-sm"
                        aria-label="Report content"
                        disabled={isLoading}
                    />
                </div>

                {/* Image Attachment Section */}
                 <div className="bg-white dark:bg-secondary rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4">Attachments / Images</h2>
                    <div className="mb-4">
                        <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 bg-gray-100 dark:bg-secondary-light hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            <UploadIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Add Images from Folder</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                multiple 
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                    
                    {images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((img, index) => (
                                <div key={index} className="relative group aspect-square bg-gray-100 dark:bg-black/20 rounded-lg overflow-hidden border dark:border-gray-600">
                                    <img src={img.previewUrl} alt="Attachment" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No images added. Images will be appended to the end of the downloaded documents.</p>
                    )}
                 </div>

                 {/* Download Actions */}
                 {reportText && (
                    <div className="flex flex-wrap gap-4 justify-end">
                         <button onClick={saveToDatabase} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-colors">
                            <SaveIcon className="w-5 h-5" />
                            Save to Database
                         </button>
                         <button onClick={downloadPDF} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-colors">
                            <DownloadIcon className="w-5 h-5" />
                            Download PDF
                         </button>
                         <button onClick={downloadDoc} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
                            <DownloadIcon className="w-5 h-5" />
                            Download DOC
                         </button>
                    </div>
                 )}
                 
                 {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
                 {successMsg && <p className="text-green-500 mt-4 text-center font-semibold">{successMsg}</p>}
            </div>

            {/* Sidebar */}
            <div>
                <h2 className="text-xl font-bold mb-4">Version History</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {versions.length > 0 ? (
                        versions.map((version, index) => (
                            <div key={index} className="p-4 bg-white dark:bg-secondary rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-primary">v{versions.length - index}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{version.timestamp.toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">{version.content}</p>
                                <button onClick={() => loadVersion(version.content)} className="text-xs w-full py-1.5 bg-gray-100 dark:bg-secondary-light hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-center transition-colors">
                                    Load Version
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 bg-gray-50 dark:bg-secondary/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No versions saved yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
