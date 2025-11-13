
import React, { useState, useCallback } from 'react';
import { generateReportSection, improveReportText } from '../services/geminiService';
import { ReportVersion } from '../types';
import { SparklesIcon, SaveIcon } from './icons';

const ActionButton: React.FC<{
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
}> = ({ onClick, disabled, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 dark:focus:ring-offset-background-dark"
    >
        {children}
    </button>
);


export const ReportGenerator: React.FC = () => {
    const [reportText, setReportText] = useState<string>('');
    const [topic, setTopic] = useState<string>('');
    const [versions, setVersions] = useState<ReportVersion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!topic) {
            setError('Please enter a topic to generate a report section.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const newContent = await generateReportSection(topic);
            setReportText(reportText ? `${reportText}\n\n${newContent}` : newContent);
        } catch (err) {
            setError('Failed to generate report section. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [topic, reportText]);

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

    const loadVersion = (content: string) => {
        setReportText(content);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">Report Editor</h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter a topic for a new section..."
                        className="flex-grow p-2 border rounded-lg bg-white dark:bg-secondary dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none"
                        disabled={isLoading}
                    />
                    <ActionButton onClick={handleGenerate} disabled={isLoading || !topic}>
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Generating...' : 'Generate Section'}
                    </ActionButton>
                </div>
                <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Start writing your report or generate content using AI..."
                    className="w-full h-96 p-4 border rounded-lg bg-white dark:bg-secondary dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none resize-y"
                    aria-label="Report content"
                    disabled={isLoading}
                />
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                     <ActionButton onClick={handleImprove} disabled={isLoading || !reportText}>
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Improving...' : 'Improve Writing'}
                    </ActionButton>
                    <ActionButton onClick={saveVersion} disabled={isLoading || !reportText}>
                        <SaveIcon className="w-5 h-5" />
                        Save Version
                    </ActionButton>
                </div>
                 {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4">Version History</h2>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {versions.length > 0 ? (
                        versions.map((version, index) => (
                            <div key={index} className="p-4 bg-gray-100 dark:bg-secondary rounded-lg">
                                <p className="font-semibold">Version {versions.length - index}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{version.timestamp.toLocaleString()}</p>
                                <p className="truncate text-sm">{version.content}</p>
                                <button onClick={() => loadVersion(version.content)} className="mt-2 text-sm text-primary hover:underline">
                                    Load this version
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No versions saved yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
