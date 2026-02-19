/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Theme colors for the incidents app with blue primary for light mode and dark mode support.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary colors
    primary: '#2563EB',
    primaryDark: '#1E40AF',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',

    // Text colors
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',

    // Background colors
    background: '#F7FAFC',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#F3F4F6',

    // Border colors
    border: '#E5E7EB',
    borderLight: '#F0F0F0',

    // UI elements
    tint: '#2563EB',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#2563EB',

    // Status colors
    statusPending: '#FEF3C7',
    statusPendingText: '#F59E0B',
    statusReceived: '#DBEAFE',
    statusReceivedText: '#2563EB',
    statusInProgress: '#E0E7FF',
    statusInProgressText: '#6366F1',
    statusResolved: '#ECFDF5',
    statusResolvedText: '#10B981',
  },
  dark: {
    // Primary colors
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',

    // Text colors
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',

    // Background colors
    background: '#000000',
    backgroundSecondary: '#1F2937',
    backgroundTertiary: '#374151',

    // Border colors
    border: '#374151',
    borderLight: '#4B5563',

    // UI elements
    tint: '#3B82F6',
    icon: '#D1D5DB',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#3B82F6',

    // Status colors
    statusPending: '#78350F',
    statusPendingText: '#FCD34D',
    statusReceived: '#1E3A8A',
    statusReceivedText: '#93C5FD',
    statusInProgress: '#312E81',
    statusInProgressText: '#A5B4FC',
    statusResolved: '#064E3B',
    statusResolvedText: '#6EE7B7',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
