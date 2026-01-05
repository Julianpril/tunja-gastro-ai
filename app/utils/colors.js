import { Platform } from 'react-native';

export const colors = {
  primary: '#10B981', // Emerald 500 - Vibrant Green
  secondary: '#F59E0B', // Amber 500 - Warm Orange
  background: '#F9FAFB', // Cool Gray 50
  surface: '#FFFFFF',
  text: {
    primary: '#111827', // Gray 900
    secondary: '#6B7280', // Gray 500
    light: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  border: '#E5E7EB',
  success: '#34D399',
  error: '#EF4444',
  overlay: 'rgba(0,0,0,0.3)',
};

const createShadow = (color, offset, opacity, radius, elevation) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${color.replace(')', `, ${opacity})`).replace('rgb', 'rgba').replace('#000', 'rgba(0,0,0')}`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
};

export const shadow = {
  small: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3.84,
      elevation: 2,
    }
  }),
  medium: Platform.select({
    web: { boxShadow: '0px 4px 10px rgba(16, 185, 129, 0.15)' },
    default: {
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    }
  }),
};
