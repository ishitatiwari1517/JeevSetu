import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING } from '../theme/colors';

const CustomInput = ({ 
  label, 
  placeholder, 
  iconName, 
  secureTextEntry, 
  rightElement,
  ...props 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {label && <Text style={styles.label}>{label}</Text>}
        {rightElement}
      </View>
      <View style={styles.inputWrapper}>
        {iconName && (
          <Icon name={iconName} size={20} color={COLORS.textSecondary} style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={secureTextEntry}
          {...props}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 16,
    paddingHorizontal: SPACING.lg,
    height: 60,
  },
  icon: {
    marginRight: SPACING.md,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomInput;
