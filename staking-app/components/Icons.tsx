import React from 'react';
import { View, Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

export const ArrowRight: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>→</Text>
  </View>
);

export const ArrowDown: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.9, color, fontWeight: '900' }}>↓</Text>
  </View>
);

export const CheckCircle: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>✓</Text>
  </View>
);

export const AlertCircle: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>⚠</Text>
  </View>
);

export const Clock: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>⏰</Text>
  </View>
);

export const XCircle: React.FC<IconProps> = ({ size = 24, color = '#000' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>✕</Text>
  </View>
);
