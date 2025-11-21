import React, { useState, useCallback } from 'react';
import { extractCertificateInfo } from '../services/geminiService';
import { VerificationResult } from '../types';
import { UploadIcon, DownloadIcon, SparklesIcon } from './icons';

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const [header, base64] = result.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
            resolve({ base64, mimeType });
        };
        reader.onerror = error => reject(error);
    });
};

export const BulkCertificateVerifier: React.FC = () => {
    const [files, setFiles] = useState<FileList | null>(null);
    const [results, setResults] = useState<VerificationResult[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCertificate, setSelectedCertificate] = useState<VerificationResult | null>(null);

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
        
        const verificationPromises = Array.from(files).map(async (file: File) => {
            try {
                const [data, fileData] = await Promise.all([
                    extractCertificateInfo(file),
                    fileToBase64(file),
                ]);
                return { 
                    fileName: file.name, 
                    data, 
                    status: 'Verified', 
                    imageBase64: fileData.base64,
                    mimeType: fileData.mimeType 
                } as VerificationResult;
            } catch (err: any) {
                console.error(`Failed to process ${file.name}:`, err);
                const fileData = await fileToBase64(file).catch(() => ({ base64: '', mimeType: 'image/png' }));
                return { 
                    fileName: file.name, 
                    data: null, 
                    status: 'Failed', 
                    error: err.message || 'Unknown error', 
                    imageBase64: fileData.base64,
                    mimeType: fileData.mimeType
                } as VerificationResult;
            }
        });

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
            <head>
                <meta charset='utf-8'>
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #000; padding: 10px; text-align: left; vertical-align: top; }
                    th { background-color: #0d9488; color: white; font-weight: bold; font-size: 14px; }
                    td { font-size: 12px; }
                    img { max-width: 300px; height: auto; display: block; margin: 5px 0; cursor: pointer; }
                    .pdf-notice { color: #0066cc; font-weight: bold; }
                    .pdf-link { display: inline-block; padding: 8px 12px; background-color: #0d9488; color: white; text-decoration: none; border-radius: 4px; margin: 5px 0; }
                    .pdf-link:hover { background-color: #0f766e; }
                </style>
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
                <x:Name>Verification Results</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
                </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
            </head>
            <body>
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
        `;

        results.forEach(res => {
            let certificateContent = 'N/A';
            
            if (res.imageBase64) {
                if (res.mimeType === 'application/pdf') {
                    // For PDFs, provide both a link and an embedded object
                    certificateContent = `
                        <div>
                            <p class="pdf-notice">📄 PDF Certificate</p>
                            <a href="data:application/pdf;base64,${res.imageBase64}" class="pdf-link" download="${res.fileName}">
                                Click to View/Download PDF
                            </a>
                            <br/>
                            <embed src="data:application/pdf;base64,${res.imageBase64}" type="application/pdf" width="300" height="400" />
                        </div>
                    `;
                } else {
                    // For images, embed directly
                    certificateContent = `<img src="data:${res.mimeType || 'image/png'};base64,${res.imageBase64}" alt="Certificate" title="Click to open full size" onclick="window.open(this.src)" />`;
                }
            }
            
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
                    <td>${certificateContent}</td>
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

    const closeCertificateModal = () => {
        setSelectedCertificate(null);
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
                                <th scope="col" className="px-6 py-3">Action</th>
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
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => setSelectedCertificate(res)}
                                            className="text-primary hover:text-primary-dark font-semibold hover:underline"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No results yet. Upload and verify certificates to see them here.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Certificate Modal */}
            {selectedCertificate && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={closeCertificateModal}
                >
                    <div 
                        className="bg-white dark:bg-secondary rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white dark:bg-secondary border-b dark:border-gray-700 p-4 flex justify-between items-center z-10">
                            <h3 className="text-xl font-bold text-text-light dark:text-text-dark">
                                {selectedCertificate.fileName}
                            </h3>
                            <div className="flex items-center gap-3">
                                {selectedCertificate.imageBase64 && (
                                    <a
                                        href={`data:${selectedCertificate.mimeType || 'application/octet-stream'};base64,${selectedCertificate.imageBase64}`}
                                        download={selectedCertificate.fileName}
                                        className="px-3 py-1 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded transition-colors duration-200"
                                    >
                                        Download
                                    </a>
                                )}
                                <button
                                    onClick={closeCertificateModal}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {selectedCertificate.imageBase64 && (
                                <div className="mb-6">
                                    {selectedCertificate.mimeType === 'application/pdf' ? (
                                        <div className="w-full border rounded-lg overflow-hidden bg-gray-100">
                                            <iframe
                                                src={`data:application/pdf;base64,${selectedCertificate.imageBase64}`}
                                                className="w-full h-[600px]"
                                                title={selectedCertificate.fileName}
                                                style={{ border: 'none' }}
                                            />
                                        </div>
                                    ) : (
                                        <img 
                                            src={`data:${selectedCertificate.mimeType || 'image/png'};base64,${selectedCertificate.imageBase64}`} 
                                            alt={selectedCertificate.fileName}
                                            className="w-full rounded-lg shadow-md"
                                            onError={(e) => {
                                                console.error('Image failed to load');
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                                const errorDiv = document.createElement('div');
                                                errorDiv.className = 'text-red-500 text-center py-4 bg-red-50 dark:bg-red-900/20 rounded-lg';
                                                errorDiv.textContent = 'Unable to display this file format. Please use the download button above.';
                                                target.parentElement?.appendChild(errorDiv);
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${selectedCertificate.status === 'Verified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                            {selectedCertificate.status}
                                        </span>
                                    </div>
                                    
                                    {selectedCertificate.data && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Name</label>
                                                <p className="text-text-light dark:text-text-dark">{selectedCertificate.data.recipientName || 'N/A'}</p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Certificate ID</label>
                                                <p className="text-text-light dark:text-text-dark">{selectedCertificate.data.certificateId || 'N/A'}</p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Title</label>
                                                <p className="text-text-light dark:text-text-dark">{selectedCertificate.data.courseTitle || 'N/A'}</p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuing Authority</label>
                                                <p className="text-text-light dark:text-text-dark">{selectedCertificate.data.issuingAuthority || 'N/A'}</p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date</label>
                                                <p className="text-text-light dark:text-text-dark">{selectedCertificate.data.issueDate || 'N/A'}</p>
                                            </div>
                                        </>
                                    )}
                                    
                                    {selectedCertificate.error && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">Error</label>
                                            <p className="text-red-600 dark:text-red-400">{selectedCertificate.error}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};