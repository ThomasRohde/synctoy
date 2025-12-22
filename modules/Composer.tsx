import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardPaste, Link2, FileText, Send as SendIcon, Lock, AlertTriangle } from 'lucide-react';
import { useApp, useNotification, useDb } from '../context';
import { useClipboard } from '../hooks';
import { Header, CategorySelector, LoadingSpinner } from '../components';
import { isValidUrl, detectContentKind, getUrlPreview, getTextPreview, haptics } from '../utils';
import { encryptContent } from '../utils/crypto';
import type { DeviceCategory, PlainContent, EncryptedContent } from '../types';

export function Composer() {
    const {
        deviceProfile,
        sharePayload,
        clearSharePayload,
        navigate,
        refreshItems,
        setSessionPassphrase,
    } = useApp();
    const notify = useNotification();
    const db = useDb();
    const { paste } = useClipboard();

    const [content, setContent] = useState('');
    const [targetCategory, setTargetCategory] = useState<DeviceCategory>(
        deviceProfile.defaultTargetCategory || 'any'
    );
    const [isSensitive, setIsSensitive] = useState(false);
    const [passphrase, setPassphrase] = useState('');
    const [confirmPassphrase, setConfirmPassphrase] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [contentKind, setContentKind] = useState<'url' | 'text'>('url');

    // Track if we've already triggered auto-send for this payload
    const [autoSendTriggered, setAutoSendTriggered] = useState(false);
    
    // Ref to track auto-send to avoid stale closure issues
    const autoSendRef = useRef(false);

    // Handle share payload from external source
    useEffect(() => {
        if (sharePayload) {
            setContent(sharePayload.content);
            if (sharePayload.category) {
                setTargetCategory(sharePayload.category);
            }
            if (sharePayload.sensitive) {
                setIsSensitive(true);
            }
            // Reset auto-send trigger for new payload
            setAutoSendTriggered(false);
            autoSendRef.current = false;
        }
    }, [sharePayload]);

    // Update content kind when content changes
    useEffect(() => {
        if (content.trim()) {
            setContentKind(detectContentKind(content));
        }
    }, [content]);

    // Check Work Mode restrictions
    const isWorkModeViolation = deviceProfile.workMode && contentKind === 'text' && content.trim();

    const handlePasteAndSend = async () => {
        const clipboardContent = await paste();
        if (clipboardContent) {
            setContent(clipboardContent);
        } else {
            notify.warning('Could not read clipboard. Try pasting manually.');
        }
    };

    const handleSend = useCallback(async () => {
        // Validate content
        if (!content.trim()) {
            notify.error('Please enter content to send');
            return;
        }

        const kind = detectContentKind(content);
        const workModeViolation = deviceProfile.workMode && kind === 'text' && content.trim();

        // Check work mode
        if (workModeViolation) {
            notify.error('Work Mode is enabled. Only URLs are allowed.');
            return;
        }

        // Validate URL if detected as URL
        if (kind === 'url' && !isValidUrl(content.trim())) {
            notify.error('Please enter a valid URL (starting with http:// or https://)');
            return;
        }

        // Validate passphrase if sensitive
        if (isSensitive) {
            if (!passphrase) {
                notify.error('Please enter a passphrase for encryption');
                return;
            }
            if (passphrase !== confirmPassphrase) {
                notify.error('Passphrases do not match');
                return;
            }
            if (passphrase.length < 4) {
                notify.error('Passphrase must be at least 4 characters');
                return;
            }
        }

        setIsSending(true);

        try {
            const plainContent: PlainContent = kind === 'url'
                ? { url: content.trim() }
                : { text: content.trim() };

            let itemContent: PlainContent | EncryptedContent = plainContent;

            // Encrypt if sensitive
            if (isSensitive) {
                itemContent = await encryptContent(plainContent, passphrase);

                // Remember passphrase for session if enabled
                if (deviceProfile.rememberPassphrase === 'session') {
                    setSessionPassphrase(passphrase);
                }
            }

            // Generate preview
            const preview = kind === 'url'
                ? getUrlPreview(content.trim())
                : getTextPreview(content.trim());

            // Add item to database
            await db.addItem({
                senderDeviceId: deviceProfile.deviceId,
                senderDeviceName: deviceProfile.deviceName,
                senderCategory: deviceProfile.category,
                targetCategory,
                kind,
                status: 'new',
                isSensitive,
                content: itemContent,
                preview,
                title: sharePayload?.title,
            });

            // Clear form
            setContent('');
            setPassphrase('');
            setConfirmPassphrase('');
            setIsSensitive(false);
            clearSharePayload();
            refreshItems();

            haptics.success();
            notify.success('Sent successfully!');
            navigate('inbox');
        } catch (error) {
            console.error('Failed to send:', error);
            haptics.error();
            notify.error('Failed to send. Please try again.');
        } finally {
            setIsSending(false);
        }
    }, [
        content, 
        isSensitive, 
        passphrase, 
        confirmPassphrase, 
        targetCategory, 
        deviceProfile, 
        sharePayload?.title,
        db, 
        notify, 
        navigate, 
        clearSharePayload, 
        refreshItems, 
        setSessionPassphrase
    ]);

    // Auto-send when sharePayload allows it (non-sensitive only)
    useEffect(() => {
        if (
            sharePayload &&
            sharePayload.autoSend !== false &&
            !sharePayload.sensitive &&
            content.trim() &&
            !autoSendTriggered &&
            !autoSendRef.current &&
            !isSending
        ) {
            // Check if content is valid before auto-sending
            const kind = detectContentKind(content);
            const isWorkViolation = deviceProfile.workMode && kind === 'text';
            const isInvalidUrl = kind === 'url' && !isValidUrl(content.trim());
            
            if (!isWorkViolation && !isInvalidUrl) {
                setAutoSendTriggered(true);
                autoSendRef.current = true;
                // Small delay to let UI render first
                const timer = setTimeout(() => {
                    handleSend();
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [sharePayload, content, autoSendTriggered, isSending, deviceProfile.workMode, handleSend]);

    return (
        <div className="min-h-[var(--app-vh)] bg-background-dark">
            <Header
                title="Send"
                subtitle={sharePayload ? 'From share' : undefined}
            />

            <main className="pt-[var(--nav-height)] pb-[calc(var(--bottom-nav-height)+16px)] px-4">
                <div className="max-w-2xl mx-auto py-6 space-y-6">
                    {/* Quick paste button */}
                    <button
                        onClick={handlePasteAndSend}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 min-h-[44px] bg-primary/20 hover:bg-primary/30 border-2 border-dashed border-primary/50 rounded-xl transition-colors"
                    >
                        <ClipboardPaste className="w-6 h-6 text-primary" />
                        <span className="text-lg font-medium text-primary">
                            Paste from Clipboard
                        </span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-sm text-gray-500">or type/paste below</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Content input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Content
                            <span className="ml-2 text-xs inline-flex items-center gap-1">
                                {contentKind === 'url' ? (
                                    <><Link2 className="w-3 h-3" /> URL detected</>
                                ) : (
                                    <><FileText className="w-3 h-3" /> Text detected</>
                                )}
                            </span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={deviceProfile.workMode ? 'Enter a URL...' : 'Enter URL or text...'}
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-500 border border-white/10 focus:border-primary outline-none resize-none"
                        />
                        {isWorkModeViolation && (
                            <p className="mt-2 text-sm text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Work Mode is enabled. Only URLs are allowed.
                            </p>
                        )}
                    </div>

                    {/* Target category */}
                    <CategorySelector
                        label="Target devices"
                        value={targetCategory}
                        onChange={setTargetCategory}
                    />

                    {/* Sensitive mode toggle */}
                    <div className="glass-card rounded-xl p-4">
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Lock className="w-5 h-5 text-rose-400" />
                                <div>
                                    <span className="font-medium">Sensitive Mode</span>
                                    <p className="text-sm text-gray-400">
                                        Encrypt with a passphrase (AES-256-GCM)
                                    </p>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isSensitive}
                                    onChange={(e) => setIsSensitive(e.target.checked)}
                                    className="sr-only"
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors ${
                                    isSensitive ? 'bg-rose-500' : 'bg-white/20'
                                }`}>
                                    <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                                        isSensitive ? 'translate-x-6' : 'translate-x-0.5'
                                    } mt-0.5`} />
                                </div>
                            </div>
                        </label>

                        {/* Passphrase inputs */}
                        {isSensitive && (
                            <div className="mt-4 space-y-3">
                                <input
                                    type="password"
                                    value={passphrase}
                                    onChange={(e) => setPassphrase(e.target.value)}
                                    placeholder="Enter passphrase"
                                    className="w-full px-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-500 border border-white/10 focus:border-rose-500 outline-none"
                                />
                                <input
                                    type="password"
                                    value={confirmPassphrase}
                                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                                    placeholder="Confirm passphrase"
                                    className="w-full px-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-500 border border-white/10 focus:border-rose-500 outline-none"
                                />
                                {passphrase && confirmPassphrase && passphrase !== confirmPassphrase && (
                                    <p className="text-sm text-red-400">Passphrases do not match</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Send button */}
                    <button
                        onClick={handleSend}
                        disabled={isSending || !content.trim() || !!isWorkModeViolation}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 min-h-[44px] bg-primary hover:bg-primary-dark rounded-xl font-medium text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <>
                                <SendIcon className="w-5 h-5" />
                                Send
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
