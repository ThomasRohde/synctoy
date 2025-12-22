import { useState, useEffect } from 'react';
import type { UserLogin } from 'dexie-cloud-addon';

interface AuthDialogProps {
    interaction: {
        type: 'email' | 'otp' | 'message-alert' | 'logout-confirmation';
        title?: string;
        alerts?: Array<{ type: 'info' | 'warning' | 'error'; message: string; messageParams?: Record<string, string> }>;
        fields?: Record<string, { type?: string; label?: string; placeholder?: string }>;
        submitLabel?: string;
        cancelLabel?: string;
        onSubmit: (fields: Record<string, string>) => void;
        onCancel: () => void;
    };
}

export function AuthDialog({ interaction }: AuthDialogProps) {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when interaction changes
    useEffect(() => {
        setFormData({});
        setIsSubmitting(false);
    }, [interaction]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await interaction.onSubmit(formData);
        } catch (error) {
            console.error('Auth submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        interaction.onCancel();
    };

    // Render different UI based on interaction type
    if (interaction.type === 'message-alert') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="glass-card rounded-xl p-6 max-w-md w-full space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">info</span>
                        {interaction.title || 'Message'}
                    </h2>

                    {interaction.alerts?.map((alert, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg ${
                                alert.type === 'error'
                                    ? 'bg-red-500/20 text-red-300'
                                    : alert.type === 'warning'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-blue-500/20 text-blue-300'
                            }`}
                        >
                            {alert.message}
                        </div>
                    ))}

                    <button
                        onClick={handleCancel}
                        className="w-full px-4 py-2.5 min-h-[44px] bg-primary rounded-lg hover:bg-primary/80 transition-colors"
                    >
                        {interaction.cancelLabel || 'OK'}
                    </button>
                </div>
            </div>
        );
    }

    if (interaction.type === 'logout-confirmation') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="glass-card rounded-xl p-6 max-w-md w-full space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-yellow-400">warning</span>
                        {interaction.title || 'Confirm Logout'}
                    </h2>

                    {interaction.alerts?.map((alert, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg ${
                                alert.type === 'warning'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-red-500/20 text-red-300'
                            }`}
                        >
                            {alert.message}
                        </div>
                    ))}

                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2.5 min-h-[44px] bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            {interaction.cancelLabel || 'Cancel'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 min-h-[44px] bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Logging out...' : (interaction.submitLabel || 'Logout')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Email or OTP input form
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 max-w-md w-full space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                        {interaction.type === 'email' ? 'mail' : 'pin'}
                    </span>
                    {interaction.title || (interaction.type === 'email' ? 'Enter Email' : 'Enter OTP Code')}
                </h2>

                {interaction.alerts?.map((alert, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg text-sm ${
                            alert.type === 'error'
                                ? 'bg-red-500/20 text-red-300'
                                : alert.type === 'warning'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-blue-500/20 text-blue-300'
                        }`}
                    >
                        {alert.message}
                    </div>
                ))}

                {interaction.fields && Object.entries(interaction.fields).map(([fieldName, fieldConfig]) => (
                    <div key={fieldName} className="space-y-2">
                        {fieldConfig.label && (
                            <label className="block text-sm font-medium text-gray-300">
                                {fieldConfig.label}
                            </label>
                        )}
                        <input
                            type={fieldConfig.type || 'text'}
                            name={fieldName}
                            value={formData[fieldName] || ''}
                            onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
                            placeholder={fieldConfig.placeholder}
                            autoFocus={Object.keys(interaction.fields || {})[0] === fieldName}
                            required
                            className="w-full px-4 py-2 bg-white/10 rounded-lg border border-white/10 focus:border-primary outline-none"
                        />
                    </div>
                ))}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2.5 min-h-[44px] bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        {interaction.cancelLabel || 'Cancel'}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 min-h-[44px] bg-primary rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : (interaction.submitLabel || 'Submit')}
                    </button>
                </div>
            </form>
        </div>
    );
}
