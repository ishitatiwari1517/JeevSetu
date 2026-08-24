import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { confirmResetPassword } from 'aws-amplify/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';

const ResetPasswordScreen = ({ email, onBackPress, onSuccess }) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!code || !newPassword) {
      Alert.alert('Error', 'Please enter both the reset code and a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });
      Alert.alert('Success', 'Password has been successfully reset. You can now log in.');
      onSuccess(); // Go back to login screen
    } catch (error) {
      console.log('Confirm reset password error', error);
      Alert.alert('Error', error.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={onBackPress}>
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.titleSection}>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>Enter the reset code sent to {email} and your new password.</Text>
        </View>

        {/* Form */}
        <CustomInput
          label="Reset Code"
          placeholder="Enter 6-digit code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        
        <CustomInput
          label="New Password"
          placeholder="••••••••"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        {loading ? (
          <View style={{ marginVertical: SPACING.md }}>
            <ActivityIndicator size="large" color={COLORS.brandGreen} />
          </View>
        ) : (
          <PrimaryButton label="Set New Password" onPress={handleReset} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  titleSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ResetPasswordScreen;
