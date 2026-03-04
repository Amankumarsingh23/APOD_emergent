export const colors = {
  // Deep space dark mode (default)
  dark: {
    background: '#0B0F1A',
    cardBackground: '#151A2B',
    accent: '#1E90FF',
    accentLight: '#4DA6FF',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AEC0',
    border: '#2D3748',
    error: '#FF6B6B',
    success: '#48BB78',
    gradient: ['#0B0F1A', '#1A1F2E'],
  },
  // Deep black mode (optional)
  deepBlack: {
    background: '#000000',
    cardBackground: '#0A0A0A',
    accent: '#1E90FF',
    accentLight: '#4DA6FF',
    textPrimary: '#FFFFFF',
    textSecondary: '#888888',
    border: '#1A1A1A',
    error: '#FF6B6B',
    success: '#48BB78',
    gradient: ['#000000', '#0A0A0A'],
  },
};

export type ThemeColors = typeof colors.dark;
