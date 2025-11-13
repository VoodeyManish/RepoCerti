
import React, { useState, useCallback } from 'react';
import { extractCertificateInfo } from '../services/geminiService';
import { VerificationResult } from '../types';
import { UploadIcon, DownloadIcon, SparklesIcon } from './icons';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Return just the base64 part, remove the prefix e.g. "data:image/png;base64,"
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

export const BulkCertificateVerifier: React.FC = () => {
    const [files, setFiles] = useState<FileList | null>(null);
    const [results, setResults] = useState<VerificationResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiles(e.target.files);
        setResults([]);
        setError(null);
    };

    const handleVerify = useCallback(async () => {
        if (!files || files.length === 0) {
            setError('Please select one or more files to verify.');
            return;
        }
        setIsLoading(true);
        setError(null);
        
        // Fix: Add type annotation for the 'file' parameter to resolve type errors.
        const verificationPromises = Array.from(files).map(async (file: File) => {
            try {
                const [data, imageBase64] = await Promise.all([
                    extractCertificateInfo(file),
                    fileToBase64(file),
                ]);
                return { fileName: file.name, data, status: 'Verified', imageBase64 } as VerificationResult;
            } catch (err: any) {
                console.error(`Failed to process ${file.name}:`, err);
                // Try to get base64 even on failure for export
                const imageBase64 = await fileToBase64(file).catch(() => '');
                return { fileName: file.name, data: null, status: 'Failed', error: err.message || 'Unknown error', imageBase64 } as VerificationResult;
            }
        });

        // This allows results to stream in as they complete
        setResults([]);
        for (const promise of verificationPromises) {
            promise.then(result => {
                setResults(prevResults => [...prevResults, result]);
            });
        }
        
        await Promise.allSettled(verificationPromises);
        setIsLoading(false);
    }, [files]);
    
    const exportToExcel = () => {
        if (results.length === 0) return;

        const headers = ['File Name', 'Status', 'Recipient Name', 'Certificate ID', 'Course Title', 'Issuing Authority', 'Issue Date', 'Error', 'Certificate Image'];
        
        let tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset='utf-8'><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>Verification Results</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
            </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
        `;

        results.forEach(res => {
            const imageTag = res.imageBase64 ? `<img src="data:image/png;base64,${res.imageBase64}" width="200" alt="Certificate">` : 'N/A';
            tableHtml += `
                <tr>
                    <td>${res.fileName}</td>
                    <td>${res.status}</td>
                    <td>${res.data?.recipientName || ''}</td>
                    <td>${res.data?.certificateId || ''}</td>
                    <td>${res.data?.courseTitle || ''}</td>
                    <td>${res.data?.issuingAuthority || ''}</td>
                    <td>${res.data?.issueDate || ''}</td>
                    <td>${res.error || ''}</td>
                    <td>${imageTag}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table></body></html>`;

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'verification_results.xls');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div>
            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-secondary mb-6">
                <input type="file" id="bulk-file-upload" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" multiple />
                <label htmlFor="bulk-file-upload" className="cursor-pointer">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {files && files.length > 0 ? `${files.length} file(s) selected` : 'Click to upload multiple images or PDFs'}
                    </p>
                </label>
            </div>
            
            <button
                onClick={handleVerify}
                disabled={!files || files.length === 0 || isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-background-dark"
            >
                <SparklesIcon className="w-6 h-6" />
                {isLoading ? `Verifying (${results.length}/${files?.length || 0})...` : 'Verify All with AI'}
            </button>
            
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Verification Results ({results.length} items)</h2>
                    <button
                        onClick={exportToExcel}
                        disabled={results.length === 0}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-5 h-5"/>
                        Export to Excel
                    </button>
                </div>
                <div className="overflow-x-auto bg-white dark:bg-secondary rounded-lg shadow-md">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-secondary-light text-xs uppercase text-text-light dark:text-text-dark">
                            <tr>
                                <th scope="col" className="px-6 py-3">File Name</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Recipient</th>
                                <th scope="col" className="px-6 py-3">Course</th>
                                <th scope="col" className="px-6 py-3">Issue Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length > 0 ? [...results].sort((a,b) => a.fileName.localeCompare(b.fileName)).map((res, index) => (
                                <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-secondary-light">
                                    <td className="px-6 py-4 font-medium text-text-light dark:text-text-dark">{res.fileName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${res.status === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                            {res.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{res.data?.recipientName || 'N/A'}</td>
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{res.data?.courseTitle || 'N/A'}</td>
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{res.data?.issueDate || 'N/A'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">No results yet. Upload and verify certificates to see them here.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};