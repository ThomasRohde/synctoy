import { useState } from 'react';
import { Copy, Eye, Code } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Components } from 'react-markdown';
import { useClipboard } from '../hooks';
import { useNotification } from '../context';
import { haptics } from '../utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    const [showRaw, setShowRaw] = useState(false);
    const { copy } = useClipboard();
    const notify = useNotification();

    const handleCopyCode = async (code: string) => {
        const success = await copy(code);
        if (success) {
            haptics.light();
            notify.success('Code copied');
        }
    };

    // Custom components for markdown rendering
    const components: Components = {
        // Code blocks with copy button
        pre: ({ children, ...props }) => {
            // Extract code content for copy button
            let codeContent = '';
            if (children && typeof children === 'object' && 'props' in children) {
                const childProps = children.props as { children?: unknown };
                if (typeof childProps.children === 'string') {
                    codeContent = childProps.children;
                }
            }

            return (
                <div className="relative group my-3">
                    <pre 
                        {...props}
                        className="bg-black/40 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed"
                    >
                        {children}
                    </pre>
                    {codeContent && (
                        <button
                            onClick={() => handleCopyCode(codeContent)}
                            className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy code"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    )}
                </div>
            );
        },
        // Inline code
        code: ({ className, children, ...props }) => {
            // Check if this is inside a pre (code block) or standalone (inline)
            const isInline = !className?.includes('language-');
            
            if (isInline) {
                return (
                    <code 
                        className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                    >
                        {children}
                    </code>
                );
            }
            
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        // Links - open in new tab
        a: ({ href, children, ...props }) => (
            <a 
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                {...props}
            >
                {children}
            </a>
        ),
        // Headings
        h1: ({ children, ...props }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 text-white" {...props}>{children}</h1>
        ),
        h2: ({ children, ...props }) => (
            <h2 className="text-lg font-bold mt-4 mb-2 text-white" {...props}>{children}</h2>
        ),
        h3: ({ children, ...props }) => (
            <h3 className="text-base font-bold mt-3 mb-2 text-white" {...props}>{children}</h3>
        ),
        h4: ({ children, ...props }) => (
            <h4 className="text-sm font-bold mt-3 mb-1 text-white" {...props}>{children}</h4>
        ),
        // Paragraphs
        p: ({ children, ...props }) => (
            <p className="my-2 leading-relaxed" {...props}>{children}</p>
        ),
        // Lists
        ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside my-2 space-y-1" {...props}>{children}</ul>
        ),
        ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside my-2 space-y-1" {...props}>{children}</ol>
        ),
        li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>{children}</li>
        ),
        // Blockquotes
        blockquote: ({ children, ...props }) => (
            <blockquote 
                className="border-l-4 border-primary/50 pl-4 my-3 italic text-gray-300"
                {...props}
            >
                {children}
            </blockquote>
        ),
        // Tables
        table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-3">
                <table className="min-w-full border-collapse" {...props}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ children, ...props }) => (
            <thead className="bg-white/10" {...props}>{children}</thead>
        ),
        th: ({ children, ...props }) => (
            <th className="border border-white/20 px-3 py-2 text-left font-medium" {...props}>
                {children}
            </th>
        ),
        td: ({ children, ...props }) => (
            <td className="border border-white/20 px-3 py-2" {...props}>{children}</td>
        ),
        // Horizontal rule
        hr: ({ ...props }) => (
            <hr className="my-4 border-white/20" {...props} />
        ),
        // Strong/bold
        strong: ({ children, ...props }) => (
            <strong className="font-bold text-white" {...props}>{children}</strong>
        ),
        // Emphasis/italic
        em: ({ children, ...props }) => (
            <em className="italic" {...props}>{children}</em>
        ),
    };

    return (
        <div className={className}>
            {/* Toggle button */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                    title={showRaw ? 'Show rendered' : 'Show source'}
                >
                    {showRaw ? (
                        <Eye className="w-4 h-4" />
                    ) : (
                        <Code className="w-4 h-4" />
                    )}
                    {showRaw ? 'Rendered' : 'Source'}
                </button>
            </div>

            {/* Content */}
            {showRaw ? (
                <pre className="text-sm whitespace-pre-wrap break-words font-mono bg-black/20 p-3 rounded-lg overflow-x-auto">
                    {content}
                </pre>
            ) : (
                <div className="markdown-content text-sm text-gray-200">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={components}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}
