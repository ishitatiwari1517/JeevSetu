import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import { listPets } from '../services/petService';

const BookingConfirmationScreen = ({ route, navigation }) => {
  const { provider, date, time } = route?.params || {
    provider: 'Happy Paws Vet',
    date: 'March 8th',
    time: '11:30 AM',
  };

  const [petName, setPetName] = useState('your pet');
  const [petId, setPetId] = useState('');
  const appointmentId = useRef(`appt-${Date.now()}`).current;

  useEffect(() => {
    listPets()
      .then(pets => {
        if (pets.length > 0) {
          setPetName(pets[0].name);
          setPetId(pets[0].id);
        }
      })
      .catch(console.warn);
  }, []);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 6,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Success Icon */}
          <Animated.View style={[styles.tickCircle, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconBackground}>
              <Icon name="check-bold" size={44} color={COLORS.white} />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <Text style={styles.title}>Booked successfully</Text>
            <Text style={styles.subtitle}>
              <Text style={styles.boldText}>{petName}'s</Text> appointment is confirmed for{' '}
              <Text style={styles.boldText}>{date} at {time}</Text> with{' '}
              <Text style={styles.boldText}>{provider}.</Text>
            </Text>

            {/* Premium Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={{ fontSize: 32 }}>🐕</Text>
                </View>
                <View style={styles.nameSection}>
                  <Text style={styles.petName}>{petName}</Text>
                  <View style={styles.statusBadge}>
                    <View style={styles.dot} />
                    <Text style={styles.statusText}>Routine Wellness Check</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailsRow}>
                <View style={styles.detailIcon}>
                  <Icon name="map-marker" size={18} color={COLORS.brandGreen} />
                </View>
                <Text style={styles.locationText}>{provider}, Downtown Clinic</Text>
              </View>
              
              <View style={styles.reminderContainer}>
                <Icon name="bell-outline" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.reminderText}>A reminder has been sent to your notifications.</Text>
              </View>
            </View>
            {/* Intake Form CTA */}
            <View style={styles.intakeCard}>
              <View style={styles.intakeHeader}>
                <View style={styles.intakeIconContainer}>
                  <Icon name="clipboard-pulse-outline" size={24} color={COLORS.primaryBlue} />
                </View>
                <Text style={styles.intakeTitle}>Help your vet prepare</Text>
              </View>
              <Text style={styles.intakeSubtitleText}>
                Complete a quick 2-minute questionnaire to help your vet understand {petName}'s condition before the session.
              </Text>
              <TouchableOpacity 
                style={styles.intakeBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('IntakeForm', { petId, petName, appointmentId })}
              >
                <Text style={styles.intakeBtnText}>Start Health Questionnaire</Text>
                <Icon name="arrow-right" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        {/* Action Buttons Section */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation?.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Return home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation?.goBack()}
            activeOpacity={0.8}
          >
            <Icon name="calendar-plus" size={20} color={COLORS.primaryBlue} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>Book another appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.7}>
            <Text style={styles.ghostBtnText}>Add to Calendar</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Safe padding for Tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Need ScrollView for better layout on smaller screens
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1 },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 40,
    paddingBottom: 20,
  },
  tickCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(230, 247, 243, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 15,
  },
  boldText: { fontWeight: '800', color: COLORS.textPrimary },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 24,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  nameSection: { flex: 1 },
  petName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brandGreen, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '600', color: COLORS.brandGreen },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E6F7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  reminderText: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', opacity: 0.8 },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 20,
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  btnText: { fontSize: 17, fontWeight: '800', color: COLORS.white },
  secondaryBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.primaryBlue },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  ghostBtnText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  
  // Intake CTA Styles
  intakeCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  intakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  intakeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  intakeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  intakeSubtitleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  intakeBtn: {
    backgroundColor: COLORS.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  intakeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default BookingConfirmationScreen;
