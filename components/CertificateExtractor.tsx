
import React, { useState, useCallback, useEffect } from 'react';
import { extractCertificateInfo } from '../services/geminiService';
import { CertificateData } from '../types';
import { UploadIcon, DownloadIcon, SparklesIcon } from './icons';

// Local type for items in the export list, extending the base data with file info for the modal.
interface CertificateExportItem extends CertificateData {
    mimeType: string;
}

export const CertificateExtractor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<CertificateData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [allCertificates, setAllCertificates] = useState<CertificateExportItem[]>([]);
    const [isAddingToList, setIsAddingToList] = useState<boolean>(false);
    const [selectedCertificate, setSelectedCertificate] = useState<CertificateExportItem | null>(null);


    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        if (selectedFile) {
            setFile(selectedFile);
            setExtractedData(null);
            setError(null);
            const objectUrl = URL.createObjectURL(selectedFile);
            setPreviewUrl(objectUrl);
        } else {
            setFile(null);
            setPreviewUrl(null);
        }
    };

    const handleExtract = useCallback(async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setExtractedData(null);
        try {
            const data = await extractCertificateInfo(file);
            setExtractedData(data);
        } catch (err) {
            setError('Failed to extract information. The image might be unclear or the format unsupported. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [file]);

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (extractedData) {
            setExtractedData({
                ...extractedData,
                [e.target.name]: e.target.value,
            });
        }
    };

    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const addToList = async () => {
        if (extractedData && file) {
            setIsAddingToList(true);
            try {
                const dataUrl = await fileToDataUrl(file);
                // Add mimeType for the modal viewer functionality
                setAllCertificates(prev => [...prev, { ...extractedData, imageBase64: dataUrl, mimeType: file.type }]);
                
                setExtractedData(null);
                setFile(null);
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);

            } catch (err) {
                setError('Could not process file for the export list.');
                console.error(err);
            } finally {
                setIsAddingToList(false);
            }
        }
    };

    const exportToExcel = () => {
        if (allCertificates.length === 0) return;

        const headers = ['Recipient Name', 'Certificate ID', 'Course Title', 'Issuing Authority', 'Issue Date', 'Certificate Image'];
        
        let tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset='utf-8'><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
            <x:Name>Certificates</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
            </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
        `;

        allCertificates.forEach(cert => {
            const buttonStyle = "text-decoration: none; display: inline-block; padding: 5px 10px; background-color: #0d9488; color: #ffffff; border-radius: 4px; font-family: sans-serif; text-align: center;";
            const imageLink = cert.imageBase64 ? `<a href="${cert.imageBase64}" style="${buttonStyle}">View Image</a>` : 'N/A';
            tableHtml += `
                <tr>
                    <td>${cert.recipientName}</td>
                    <td>${cert.certificateId}</td>
                    <td>${cert.courseTitle}</td>
                    <td>${cert.issuingAuthority}</td>
                    <td>${cert.issueDate}</td>
                    <td>${imageLink}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table></body></html>`;

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'certificates.xls');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const closeCertificateModal = () => {
        setSelectedCertificate(null);
    };

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Upload Certificate</h2>
                    <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-secondary">
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {file ? `Selected: ${file.name}` : 'Click to upload an image or PDF'}
                            </p>
                        </label>
                    </div>
                    {previewUrl && file && (
                        <div className="mt-4">
                            <h3 className="font-semibold">Preview:</h3>
                            {file.type.startsWith('image/') ? (
                                <img src={previewUrl} alt="Certificate Preview" className="mt-2 rounded-lg shadow-md max-h-96 w-auto mx-auto" />
                            ) : file.type === 'application/pdf' ? (
                                <iframe src={previewUrl} title="Certificate Preview" className="mt-2 w-full h-96 rounded-lg shadow-md border-0" />
                            ) : (
                                <div className="mt-2 text-center p-4 rounded-lg bg-gray-100 dark:bg-secondary-light text-gray-500 dark:text-gray-400">
                                    <p>Preview not available for this file type ({file.type}).</p>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleExtract}
                        disabled={!file || isLoading}
                        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-background-dark"
                    >
                        <SparklesIcon className="w-6 h-6" />
                        {isLoading ? 'Extracting Data...' : 'Extract with AI'}
                    </button>
                    {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Extracted Information</h2>
                    {extractedData ? (
                        <div className="space-y-4 p-6 bg-white dark:bg-secondary rounded-lg shadow-md">
                            {(Object.keys(extractedData) as Array<keyof CertificateData>).map((key) => (
                                key !== 'imageBase64' &&
                                <div key={key}>
                                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <input
                                        type="text"
                                        id={key}
                                        name={key}
                                        value={extractedData[key as keyof Omit<CertificateData, 'imageBase64'>]}
                                        onChange={handleDataChange}
                                        className="mt-1 block w-full p-2 border rounded-md bg-gray-50 dark:bg-secondary-light dark:border-gray-600 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            ))}
                            <button onClick={addToList} disabled={isAddingToList} className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {isAddingToList ? 'Adding...' : 'Add to Export List'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full p-6 bg-gray-50 dark:bg-secondary rounded-lg shadow-inner text-gray-500 dark:text-gray-400">
                            <p>Data will appear here after extraction.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Export List ({allCertificates.length} items)</h2>
                    <button
                        onClick={exportToExcel}
                        disabled={allCertificates.length === 0}
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
                                <th scope="col" className="px-6 py-3">Recipient Name</th>
                                <th scope="col" className="px-6 py-3">Certificate ID</th>
                                <th scope="col" className="px-6 py-3">Course Title</th>
                                <th scope="col" className="px-6 py-3">Issuing Authority</th>
                                <th scope="col" className="px-6 py-3">Issue Date</th>
                                <th scope="col" className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allCertificates.length > 0 ? allCertificates.map((cert, index) => (
                                <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-secondary-light">
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{cert.recipientName}</td>
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{cert.certificateId}</td>
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{cert.courseTitle}</td>
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{cert.issuingAuthority}</td>
                                    <td className="px-6 py-4 text-text-light dark:text-text-dark">{cert.issueDate}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => setSelectedCertificate(cert)}
                                            className="text-primary hover:text-primary-dark font-semibold hover:underline"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No certificates added to the list.</td>
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
                        <div className="sticky top-0 bg-white dark:bg-secondary border-b dark:border-gray-700 p-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-light dark:text-text-dark">
                                Certificate for {selectedCertificate.recipientName}
                            </h3>
                            <div className="flex items-center gap-3">
                                {selectedCertificate.imageBase64 && (
                                    <a
                                        href={selectedCertificate.imageBase64}
                                        download={`Certificate-${selectedCertificate.recipientName}.${selectedCertificate.mimeType.split('/')[1] || 'file'}`}
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
                                        <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                                            <iframe
                                                src={selectedCertificate.imageBase64}
                                                className="w-full h-full"
                                                title={`Certificate for ${selectedCertificate.recipientName}`}
                                            />
                                        </div>
                                    ) : (
                                        <img 
                                            src={selectedCertificate.imageBase64}
                                            alt={`Certificate for ${selectedCertificate.recipientName}`}
                                            className="w-full rounded-lg shadow-md"
                                        />
                                    )}
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {(Object.keys(selectedCertificate) as Array<keyof CertificateExportItem>).map((key) => {
                                        if (key === 'imageBase64' || key === 'mimeType') return null;
                                        const value = selectedCertificate[key];
                                        return (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1')}
                                                </label>
                                                <p className="text-text-light dark:text-text-dark">{value || 'N/A'}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
