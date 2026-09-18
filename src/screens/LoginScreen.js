import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';
import { COLORS, SPACING } from '../theme/colors';
import CustomInput from '../components/CustomInput';
import PrimaryButton from '../components/PrimaryButton';
import SocialButton from '../components/SocialButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const dogImage = require('../assets/dog.png');

const LoginScreen = ({
  onSignUpPress,
  onPhonePress,
  onForgotPress,
  onUnconfirmedUser,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });
      
      if (nextStep && nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        if (onUnconfirmedUser) {
          onUnconfirmedUser(email);
        }
        return;
      }
      
      // Success! Amplify Hub will trigger auth state change
    } catch (error) {
      let errorMessage = 'Something went wrong';
      const errCode = error.name || error.code;
      if (errCode === 'UserNotFoundException' || errCode === 'NotAuthorizedException') {
        errorMessage = 'Invalid email or password';
      } else if (errCode === 'InvalidParameterException') {
        errorMessage = 'Invalid email address format';
      } else {
        errorMessage = error.message || 'Login failed';
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
        {/* Profile Image Section */}
        <View style={styles.headerSection}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/petvue_logo.jpg')}
              style={styles.profileImage}
              resizeMode="cover"
            />
            <View style={styles.pawIconContainer}>
              <Icon name="paw" size={16} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.brandName}>JeevSetu</Text>
          <View style={styles.brandUnderline} />
        </View>

        {/* Welcome Text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your organisation's dashboard</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <CustomInput
            label="Email"
            placeholder="hello@petowner.com"
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
            rightElement={
              <TouchableOpacity onPress={onForgotPress}>
                <Text style={styles.forgotText}>FORGOT?</Text>
              </TouchableOpacity>
            }
          />
          {password.length > 0 && password.length < 6 && (
            <Text style={{ color: 'red', fontSize: 12, marginTop: -15, marginBottom: 15 }}>
              Password must be at least 6 characters
            </Text>
          )}

          {loading ? (
            <View style={{ marginVertical: SPACING.md }}>
              <ActivityIndicator size="large" color={COLORS.brandGreen} />
            </View>
          ) : (
            <PrimaryButton label="Sign in" onPress={handleLogin} />
          )}
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social & Phone Buttons */}
        <View style={styles.socialRow}>
          <SocialButton label="Google" iconName="google" onPress={onGoogleButtonPress} />
          <SocialButton label="Facebook" iconName="facebook" onPress={onFacebookButtonPress} />
        </View>
        
        <View style={{ marginTop: SPACING.sm, marginBottom: SPACING.md }}>
          <SocialButton label="Continue with Phone (OTP)" iconName="phone" onPress={onPhonePress} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onSignUpPress}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Pagination Dots (Visual only) */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
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
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    padding: 8,
    position: 'relative',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  pawIconContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.brandGreen,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827', // Exact dark color from design
    letterSpacing: -0.5,
  },
  brandUnderline: {
    width: 30,
    height: 3,
    backgroundColor: '#C4E0DC', // Mint underline from design
    marginTop: 2,
    borderRadius: 2,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  forgotText: {
    color: COLORS.brandGreen,
    fontSize: 11,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signUpLink: {
    color: COLORS.brandGreen,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#C4E0DC',
    width: 10,
    height: 10,
  },
});

export default LoginScreen;
