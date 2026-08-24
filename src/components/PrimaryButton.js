import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, SPACING } from '../theme/colors';

const PrimaryButton = ({ label, onPress, iconName = 'arrow-right' }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.text}>{label}</Text>
      <Icon name={iconName} size={20} color={COLORS.white} style={styles.icon} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginVertical: SPACING.md,
    // Premium soft shadow
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  icon: {
    marginLeft: SPACING.xs,
  },
});

export default PrimaryButton;
