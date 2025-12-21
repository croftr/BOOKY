import { BookOpen, Newspaper, Image, LucideIcon } from 'lucide-react';

export interface CategoryConfig {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string; // Tailwind color class
}

export const CATEGORIES: CategoryConfig[] = [
  {
    value: 'Story',
    label: 'Story',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'Factual',
    label: 'Factual',
    icon: Newspaper,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'Picture',
    label: 'Picture',
    icon: Image,
    color: 'text-purple-600 dark:text-purple-400',
  },
];

export function getCategoryConfig(categoryValue: string): CategoryConfig | undefined {
  return CATEGORIES.find((cat) => cat.value === categoryValue);
}
