import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Professional & Calm Palette
export const COLORS = {
    primary: '#3B82F6', // Tranquil Blue
    secondary: '#64748B', // Slate Grey
    accent: '#10B981', // Calm Green
    background: '#F8FAFC', // Very light grey/white
    card: '#FFFFFF',
    text: '#1E293B', // Dark Slate
    subtext: '#64748B',
    border: '#E2E8F0',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    white: '#FFFFFF',
    black: '#000000',
    danger: '#DC2626',
};

export const DARK_COLORS = {
    primary: '#60A5FA',
    secondary: '#94A3B8',
    accent: '#34D399',
    background: '#0F172A', // Dark Slate
    card: '#1E293B',
    text: '#F8FAFC',
    subtext: '#94A3B8',
    border: '#334155',
    success: '#34D399',
    error: '#F87171',
    warning: '#FBBF24',
    info: '#60A5FA',
    white: '#FFFFFF',
    black: '#000000',
    danger: '#EF4444',
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const LAYOUT = {
    window: { width, height },
    borderRadius: 12,
    borderRadiusSmall: 8,
    borderRadiusLarge: 20,
};

export const getColor = (key: 'background' | 'cardBackground' | 'textPrimary' | 'textSecondary' | 'border' | 'primary', isDark: boolean) => {
    const palette = isDark ? DARK_COLORS : COLORS;
    switch (key) {
        case 'background': return palette.background;
        case 'cardBackground': return palette.card;
        case 'textPrimary': return palette.text;
        case 'textSecondary': return palette.subtext;
        case 'border': return palette.border;
        case 'primary': return palette.primary;
        default: return palette.text;
    }
};
