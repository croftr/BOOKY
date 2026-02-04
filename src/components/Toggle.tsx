import React from 'react';

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}

export default function Toggle({ label, checked, onChange, id }: ToggleProps) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const labelId = `${inputId}-label`;

    return (
        <div className="flex items-center gap-3">
            <label id={labelId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={checked}
                aria-labelledby={labelId}
            >
                <span
                    className={`${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </button>
        </div>
    );
}
