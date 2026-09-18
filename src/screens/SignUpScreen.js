import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { signUp, signInWithRedirect } from 'aws-amplify/auth';
import { COLORS, SPACING } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import SocialButton from '../components/SocialButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SignUpScreen = ({ onSignInPress, onPhonePress, onSignUpSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: { email: email, name: fullName },
        }
      });
      if (onSignUpSuccess) {
        onSignUpSuccess(email);
      } else {
        Alert.alert('Account Created!', 'Please check your email to verify your account, then sign in.', [
          { text: 'OK', onPress: () => onSignInPress && onSignInPress() }
        ]);
      }
    } catch (error) {
      let errorMessage = 'Something went wrong';
      const errCode = error.name || error.code;
      if (errCode === 'UsernameExistsException') {
        errorMessage = 'That email address is already in use!';
      } else if (errCode === 'InvalidPasswordException') {
        errorMessage = 'Password must be at least 6 characters.';
      } else {
        errorMessage = error.message || 'Sign up failed';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (error) {
      console.log('Google Sign-In error:', JSON.stringify(error));
      Alert.alert('Google Error', error.message || error.toString() || 'Failed to start Google Sign-In');
    }
  };

  const onFacebookButtonPress = async () => {
    try {
      await signInWithRedirect({ provider: 'Facebook' });
    } catch (error) {
      console.log('Facebook Sign-In error:', JSON.stringify(error));
      Alert.alert('Facebook Error', error.message || error.toString() || 'Failed to start Facebook Sign-In');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Icon name="paw" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.brandName}>JeevSetu</Text>
          <Text style={styles.brandSubtitle}>Create your account</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <CustomInput 
            label="Full Name" 
            placeholder="Guardian / Owner Name" 
            iconName="user"
            value={fullName}
            onChangeText={setFullName}
          />
          <CustomInput 
            label="Email Address" 
            placeholder="guardian@jeevsetu.com" 
            iconName="at-sign"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <CustomInput 
            label="Password" 
            placeholder="••••••••" 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {password.length > 0 && password.length < 6 && (
            <Text style={{ color: 'red', fontSize: 12, marginTop: -15, marginBottom: 15 }}>
              Password must be at least 6 characters
            </Text>
          )}
          <CustomInput 
            label="Confirm Password" 
            placeholder="••••••••" 
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {loading ? (
            <View style={{ marginVertical: SPACING.md }}>
              <ActivityIndicator size="large" color={COLORS.brandGreen} />
            </View>
          ) : (
            <PrimaryButton label="Get started" onPress={handleSignUp} />
          )}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <SocialButton label="Google" iconName="google" onPress={onGoogleButtonPress} />
            <SocialButton label="Facebook" iconName="facebook" onPress={onFacebookButtonPress} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onSignInPress}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  brandSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 36,
    padding: SPACING.lg,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginTop: SPACING.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signInLink: {
    color: COLORS.brandGreen,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
