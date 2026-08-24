import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { resetPassword } from 'aws-amplify/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';

const ForgotPasswordScreen = ({ onBackPress, onCodeSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ username: email });
      Alert.alert('Success', 'Password reset code sent to your email.');
      onCodeSent(email); // Proceed to the Reset Password screen
    } catch (error) {
      console.log('Reset password error', error);
      Alert.alert('Error', error.message || 'Could not send reset code');
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email address and we'll send you a code to reset your password.</Text>
        </View>

        {/* Form */}
        <CustomInput
          label="Email Address"
          placeholder="hello@petowner.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {loading ? (
          <View style={{ marginVertical: SPACING.md }}>
            <ActivityIndicator size="large" color={COLORS.brandGreen} />
          </View>
        ) : (
          <PrimaryButton label="Send Code" onPress={handleReset} />
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

export default ForgotPasswordScreen;
