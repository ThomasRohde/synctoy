import { Briefcase, Home, Globe } from 'lucide-react';
import type { DeviceCategory } from '../types';

interface CategorySelectorProps {
    value: DeviceCategory;
    onChange: (category: DeviceCategory) => void;
    label?: string;
}

const CATEGORIES: { id: DeviceCategory; label: string; icon: typeof Briefcase; color: string }[] = [
    { id: 'work', label: 'Work', icon: Briefcase, color: 'category-work' },
    { id: 'private', label: 'Private', icon: Home, color: 'category-private' },
    { id: 'any', label: 'Any', icon: Globe, color: 'category-any' },
];

export function CategorySelector({ value, onChange, label }: CategorySelectorProps) {
    return (
        <div>
            {label && (
                <label className="block text-sm text-gray-400 mb-2">{label}</label>
            )}
            <div className="flex gap-2">
                {CATEGORIES.map(cat => {
                    const isActive = value === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onChange(cat.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border
                                transition-all duration-150
                                ${isActive
                                    ? `${cat.color} border-current`
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                }
                            `}
                        >
                            <cat.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{cat.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
