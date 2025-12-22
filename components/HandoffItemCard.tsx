import { useState, useRef, useEffect } from 'react';
import type { HandoffItem, PlainContent } from '../types';
import { useApp, useNotification, useDb } from '../context';
import { useClipboard, useSwipeGesture } from '../hooks';
import { decryptContent } from '../utils/crypto';
import { getUrlPreview, getTextPreview, getDomain, getFaviconUrl } from '../utils/url';

interface HandoffItemCardProps {
    item: HandoffItem;
    onStatusChange?: () => void;
}

export function HandoffItemCard({ item, onStatusChange }: HandoffItemCardProps) {
    const { deviceProfile, sessionPassphrase, setSessionPassphrase } = useApp();
    const notify = useNotification();
    const db = useDb();
    const { copy } = useClipboard();
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [decryptedContent, setDecryptedContent] = useState<PlainContent | null>(null);
    const [showPassphraseInput, setShowPassphraseInput] = useState(false);
    const [passphraseInput, setPassphraseInput] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const isEncrypted = item.isSensitive && 'ciphertext' in item.content;
    const content = decryptedContent ?? (isEncrypted ? null : (item.content as PlainContent));

    const handleArchive = async () => {
        await db.updateItemStatus(item.id, 'archived');
        onStatusChange?.();
        notify.success('Archived');
    };

    // Swipe-to-archive gesture
    const { swipeState, handlers } = useSwipeGesture({
        onSwipeLeft: () => {
            if (item.status !== 'archived') {
                handleArchive();
            }
        },
        threshold: 100,
        enabled: item.status !== 'archived',
    });

    // Apply swipe transform
    useEffect(() => {
        if (cardRef.current) {
            const transform = swipeState.isSwiping
                ? `translateX(${swipeState.offsetX}px)`
                : 'translateX(0)';
            const transition = swipeState.isSwiping ? 'none' : 'transform 0.2s ease-out';
            
            cardRef.current.style.transform = transform;
            cardRef.current.style.transition = transition;
        }
    }, [swipeState]);

    const handleDecrypt = async (passphrase: string) => {
        if (!isEncrypted) return;
        setIsDecrypting(true);

        try {
            const decrypted = await decryptContent(
                item.content as { ciphertext: string; crypto: any },
                passphrase
            );
            setDecryptedContent(decrypted);
            setShowPassphraseInput(false);

            // Remember passphrase for session if enabled
            if (deviceProfile.rememberPassphrase === 'session') {
                setSessionPassphrase(passphrase);
            }

            notify.success('Decrypted successfully');
        } catch (error) {
            notify.error('Incorrect passphrase');
        } finally {
            setIsDecrypting(false);
        }
    };

    const handleOpen = async () => {
        // If encrypted and not decrypted, try session passphrase or show input
        if (isEncrypted && !decryptedContent) {
            if (sessionPassphrase) {
                await handleDecrypt(sessionPassphrase);
            } else {
                setShowPassphraseInput(true);
            }
            return;
        }

        // Mark as opened
        if (item.status === 'new') {
            await db.updateItemStatus(item.id, 'opened');
            onStatusChange?.();
        }

        // Handle content
        if (content?.url) {
            window.open(content.url, '_blank', 'noopener,noreferrer');
        } else if (content?.text) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleCopy = async () => {
        if (isEncrypted && !decryptedContent) {
            if (sessionPassphrase) {
                await handleDecrypt(sessionPassphrase);
            } else {
                setShowPassphraseInput(true);
            }
            return;
        }

        const textToCopy = content?.url ?? content?.text ?? '';
        if (textToCopy) {
            const success = await copy(textToCopy);
            if (success) {
                notify.success('Copied to clipboard');
            }
        }
    };

    const handleMarkDone = async () => {
        await db.updateItemStatus(item.id, 'done');
        onStatusChange?.();
        notify.success('Marked as done');
    };

    const handleUnarchive = async () => {
        await db.updateItemStatus(item.id, 'done');
        onStatusChange?.();
        notify.success('Unarchived');
    };

    const getPreview = () => {
        if (isEncrypted && !decryptedContent) {
            return '🔒 Encrypted content';
        }
        if (content?.url) {
            return getUrlPreview(content.url);
        }
        if (content?.text) {
            return getTextPreview(content.text);
        }
        return '';
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div
            ref={cardRef}
            className="relative overflow-visible"
            {...handlers}
        >
            {/* Swipe background indicator */}
            {swipeState.isSwiping && swipeState.direction === 'left' && (
                <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-end px-6">
                    <span className="material-symbols-outlined text-red-400 text-2xl">
                        archive
                    </span>
                </div>
            )}

            {/* Main card */}
            <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
            {/* Main card content */}
            <div className="p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Icon/Favicon */}
                        <div className="flex-shrink-0">
                            {item.kind === 'url' && content?.url ? (
                                <img
                                    src={getFaviconUrl(content.url)}
                                    alt=""
                                    className="w-8 h-8 rounded"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                    item.kind === 'url' ? 'kind-url' : 'kind-text'
                                }`}>
                                    <span className="material-symbols-outlined text-sm">
                                        {item.kind === 'url' ? 'link' : 'notes'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Title and preview */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {item.kind === 'url' && content?.url && (
                                    <span className="text-sm font-medium truncate">
                                        {getDomain(content.url)}
                                    </span>
                                )}
                                {item.title && (
                                    <span className="text-sm font-medium truncate">
                                        {item.title}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-400 truncate">{getPreview()}</p>
                        </div>
                    </div>

                    {/* Timestamp */}
                    <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDate(item.createdAt)}
                    </span>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {/* Status badge */}
                    <span className={`status-badge status-${item.status}`}>
                        {item.status}
                    </span>

                    {/* Target category badge */}
                    <span className={`status-badge category-${item.targetCategory}`}>
                        {item.targetCategory === 'work' ? '💼' : item.targetCategory === 'private' ? '🏠' : '🌐'}{' '}
                        {item.targetCategory}
                    </span>

                    {/* Encrypted badge */}
                    {item.isSensitive && (
                        <span className="status-badge encrypted-badge">
                            🔒 encrypted
                        </span>
                    )}

                    {/* Sender info */}
                    <span className="text-xs text-gray-500">
                        from {item.senderDeviceName}
                    </span>
                </div>

                {/* Expanded text content */}
                {isExpanded && content?.text && (
                    <div className="mb-3 p-3 bg-black/20 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap break-words">{content.text}</p>
                    </div>
                )}

                {/* Passphrase input */}
                {showPassphraseInput && (
                    <div className="mb-3 p-3 bg-black/20 rounded-lg">
                        <label className="block text-sm text-gray-400 mb-2">
                            Enter passphrase to decrypt
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={passphraseInput}
                                onChange={(e) => setPassphraseInput(e.target.value)}
                                placeholder="Passphrase"
                                className="flex-1 px-3 py-2 bg-white/10 rounded-lg border border-white/10 focus:border-primary outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleDecrypt(passphraseInput);
                                    }
                                }}
                            />
                            <button
                                onClick={() => handleDecrypt(passphraseInput)}
                                disabled={isDecrypting || !passphraseInput}
                                className="px-4 py-2.5 min-h-[44px] bg-primary rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                {isDecrypting ? 'Decrypting...' : 'Unlock'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleOpen}
                        className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {item.kind === 'url' ? 'open_in_new' : 'visibility'}
                        </span>
                        {item.kind === 'url' ? 'Open' : isExpanded ? 'Hide' : 'View'}
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">content_copy</span>
                        Copy
                    </button>

                    {item.status !== 'done' && item.status !== 'archived' && (
                        <button
                            onClick={handleMarkDone}
                            className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">check</span>
                            Done
                        </button>
                    )}

                    {item.status !== 'archived' ? (
                        <button
                            onClick={handleArchive}
                            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title="Archive"
                        >
                            <span className="material-symbols-outlined text-lg">archive</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleUnarchive}
                            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title="Unarchive"
                        >
                            <span className="material-symbols-outlined text-lg">unarchive</span>
                        </button>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}
