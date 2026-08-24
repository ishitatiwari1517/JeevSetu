import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
// import auth from '@react-native-firebase/auth';
import { COLORS } from '../theme/colors';

const PhoneAuthScreen = ({ onBackPress }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle the button press
  async function signInWithPhoneNumber() {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number with country code (e.g. +91...)');
      return;
    }

    setLoading(true);
    try {
      // Temporarily disabled Firebase Auth to fix startup crash
      Alert.alert('Simulated OTP', 'OTP sent to ' + phoneNumber);
      setConfirm({ simulated: true });
    } catch (error) {
      console.log('Phone sign in error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode() {
    if (code.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      // Temporarily disabled Firebase Auth to fix startup crash
      Alert.alert('Success', 'Phone login simulated successfully!');
    } catch (error) {
      console.log('OTP verification error:', error);
      Alert.alert('Invalid OTP', 'The code you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  }

  if (!confirm) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Phone Login</Text>
          <Text style={styles.subtitle}>Enter your phone number with country code (e.g. +91) to receive an OTP</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <Text style={styles.countryCode}>🇮🇳 +91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="98765 43210"
                value={phoneNumber.replace('+91', '')}
                onChangeText={(text) => setPhoneNumber('+91' + text)}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
            <Text style={styles.hint}>Include +91 followed by your 10-digit number</Text>
          </View>

          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={signInWithPhoneNumber}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => setConfirm(null)}>
          <Text style={styles.backText}>← Change Number</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {phoneNumber}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={confirmCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Verify & Login</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 30,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 30,
  },
  backText: {
    color: '#666',
    fontSize: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  countryCode: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold',
    paddingRight: 10,
    paddingVertical: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 24,
    color: '#333',
    paddingVertical: 10,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    fontSize: 24,
    color: '#333',
    paddingVertical: 10,
    fontWeight: 'bold',
  },
  mainButton: {
    backgroundColor: '#5DA7D3',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 8,
    shadowColor: '#5DA7D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PhoneAuthScreen;
