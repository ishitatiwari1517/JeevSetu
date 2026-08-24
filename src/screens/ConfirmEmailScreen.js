import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { COLORS } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';

const ConfirmEmailScreen = ({ email, onConfirmSuccess, onBackPress }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code
      });
      Alert.alert('Success', 'Email verified successfully! You can now log in.', [
        { text: 'OK', onPress: onConfirmSuccess }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: email });
      Alert.alert('Success', 'A new verification code has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirm Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to {'\n'}
          <Text style={{fontWeight: 'bold'}}>{email}</Text>
        </Text>

        <CustomInput
          icon="lock-outline"
          placeholder="Enter Verification Code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />

        <PrimaryButton 
          title="Verify Account" 
          onPress={handleConfirm}
          disabled={loading}
        />
        {loading && <ActivityIndicator size="small" color={COLORS.brandGreen} style={{marginTop: 10}} />}

        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText}>Didn't receive the code? </Text>
          <Text style={styles.linkText} onPress={handleResendCode}>
            Resend
          </Text>
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.linkText} onPress={onBackPress}>
            Back to Login
          </Text>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  bottomText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  linkText: {
    color: COLORS.brandGreen,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ConfirmEmailScreen;
