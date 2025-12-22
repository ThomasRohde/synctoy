import { useState } from 'react';
import { ArrowLeftRight, Smartphone, SlidersHorizontal, Briefcase, Clock, ArrowRight, CheckCircle, Briefcase as WorkIcon, Home, Globe } from 'lucide-react';
import { useApp, useNotification } from '../context';
import { CategorySelector, LoadingSpinner } from '../components';
import type { DeviceCategory } from '../types';

type SetupStep = 'welcome' | 'device' | 'preferences' | 'complete';

export function Setup() {
    const { deviceProfile, updateDeviceProfile, navigate } = useApp();
    const notify = useNotification();
    
    const [step, setStep] = useState<SetupStep>('welcome');
    const [deviceName, setDeviceName] = useState(deviceProfile.deviceName || getDefaultDeviceName());
    const [category, setCategory] = useState<DeviceCategory>(deviceProfile.category || 'any');
    const [workMode, setWorkMode] = useState(deviceProfile.workMode);
    const [retentionDays, setRetentionDays] = useState(deviceProfile.retentionDays || 7);
    const [isCompleting, setIsCompleting] = useState(false);

    function getDefaultDeviceName(): string {
        // Try to get a sensible default name
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows Device';
        if (ua.includes('Mac')) return 'Mac Device';
        if (ua.includes('iPhone')) return 'iPhone';
        if (ua.includes('iPad')) return 'iPad';
        if (ua.includes('Android')) return 'Android Device';
        if (ua.includes('Linux')) return 'Linux Device';
        return 'My Device';
    }

    const handleComplete = async () => {
        if (!deviceName.trim()) {
            notify.error('Please enter a device name');
            return;
        }

        setIsCompleting(true);
        try {
            await updateDeviceProfile({
                deviceName: deviceName.trim(),
                category,
                workMode,
                retentionDays,
                defaultTargetCategory: category === 'work' ? 'private' : category === 'private' ? 'work' : 'any',
                isSetupComplete: true,
            });

            setStep('complete');
            setTimeout(() => {
                navigate('inbox');
            }, 1500);
        } catch {
            notify.error('Failed to save settings');
            setIsCompleting(false);
        }
    };

    return (
        <div className="min-h-[var(--app-vh)] bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Welcome step */}
                {step === 'welcome' && (
                    <div className="text-center animate-fade-in-up">
                        <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                            <ArrowLeftRight className="w-12 h-12 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Handoff Lite</h1>
                        <p className="text-gray-400 mb-8">
                            Send URLs and text between devices instantly with optional encryption and device targeting.
                        </p>
                        <button
                            onClick={() => setStep('device')}
                            className="w-full py-4 min-h-[44px] bg-primary hover:bg-primary-dark rounded-xl font-medium text-lg transition-colors"
                        >
                            Get Started
                        </button>
                    </div>
                )}

                {/* Device setup step */}
                {step === 'device' && (
                    <div className="animate-fade-in-up">
                        <div className="text-center mb-8">
                            <Smartphone className="w-10 h-10 text-primary mb-2 mx-auto" />
                            <h2 className="text-2xl font-bold">Set up this device</h2>
                            <p className="text-gray-400 mt-2">
                                Give this device a name and category
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Device Name
                                </label>
                                <input
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    placeholder="My Device"
                                    className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-500 border border-white/10 focus:border-primary outline-none"
                                />
                            </div>

                            <CategorySelector
                                label="Device Category"
                                value={category}
                                onChange={setCategory}
                            />

                            <p className="text-sm text-gray-400">
                                {category === 'work' && (
                                    <span className="flex items-center gap-2 justify-center">
                                        <Briefcase className="w-4 h-4" /> Work devices only receive work-targeted items
                                    </span>
                                )}
                                {category === 'private' && (
                                    <span className="flex items-center gap-2 justify-center">
                                        <Home className="w-4 h-4" /> Private devices only receive private-targeted items
                                    </span>
                                )}
                                {category === 'any' && (
                                    <span className="flex items-center gap-2 justify-center">
                                        <Globe className="w-4 h-4" /> This device will receive all items
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setStep('welcome')}
                                className="flex-1 py-3 min-h-[44px] bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep('preferences')}
                                className="flex-1 py-3 min-h-[44px] bg-primary hover:bg-primary-dark rounded-xl font-medium transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Preferences step */}
                {step === 'preferences' && (
                    <div className="animate-fade-in-up">
                        <div className="text-center mb-8">
                            <SlidersHorizontal className="w-10 h-10 text-primary mb-2 mx-auto" />
                            <h2 className="text-2xl font-bold">Preferences</h2>
                            <p className="text-gray-400 mt-2">
                                Configure how Handoff Lite works
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="glass-card rounded-xl p-4">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <WorkIcon className="w-5 h-5 text-amber-400" />
                                        <div>
                                            <span className="font-medium">Work Mode</span>
                                            <p className="text-sm text-gray-400">
                                                Only allow sending URLs
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={workMode}
                                            onChange={(e) => setWorkMode(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-12 h-6 rounded-full transition-colors ${
                                            workMode ? 'bg-amber-500' : 'bg-white/20'
                                        }`}>
                                            <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                                                workMode ? 'translate-x-6' : 'translate-x-0.5'
                                            } mt-0.5`} />
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="glass-card rounded-xl p-4">
                                <h3 className="font-medium flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5" />
                                    Auto-Archive After
                                </h3>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={retentionDays}
                                        onChange={(e) => setRetentionDays(Number(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-lg font-medium w-20 text-right">
                                        {retentionDays} days
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setStep('device')}
                                className="flex-1 py-3 min-h-[44px] bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={isCompleting}
                                className="flex-1 py-3 min-h-[44px] bg-primary hover:bg-primary-dark rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCompleting ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <>
                                        Complete Setup
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Complete step */}
                {step === 'complete' && (
                    <div className="text-center animate-pop-in">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">You're all set!</h2>
                        <p className="text-gray-400">
                            Opening your inbox...
                        </p>
                    </div>
                )}

                {/* Progress dots */}
                {step !== 'complete' && (
                    <div className="flex justify-center gap-2 mt-8">
                        {['welcome', 'device', 'preferences'].map((s, i) => (
                            <div
                                key={s}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    ['welcome', 'device', 'preferences'].indexOf(step) >= i
                                        ? 'bg-primary'
                                        : 'bg-white/20'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
