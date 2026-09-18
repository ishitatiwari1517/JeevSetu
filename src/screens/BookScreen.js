import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';

const SERVICES = ['Vet Visit', 'Grooming', 'Vaccination'];

const PROVIDERS = [
  {
    id: '1',
    name: 'Paws & Whiskers Clinic',
    rating: 4.9,
    reviews: 120,
    distance: '1.2 km away',
    emoji: '🏥',
  },
  {
    id: '2',
    name: 'Pet Wellness Center',
    rating: 4.7,
    reviews: 85,
    distance: '2.8 km away',
    emoji: '🩺',
  },
  {
    id: '3',
    name: 'Happy Paws Vet',
    rating: 4.5,
    reviews: 63,
    distance: '4.0 km away',
    emoji: '🐾',
  },
];

const DAYS = [
  { day: 'MON', date: 6 },
  { day: 'TUE', date: 7 },
  { day: 'WED', date: 8 },
  { day: 'THU', date: 9 },
  { day: 'FRI', date: 10 },
];

const TIME_SLOTS = ['09:00 AM', '10:15 AM', '11:30 AM', '02:45 PM'];

const BookScreen = ({ navigation }) => {
  const [selectedService, setSelectedService] = useState('Vet Visit');
  const [selectedProvider, setSelectedProvider] = useState('1');
  const [selectedDay, setSelectedDay] = useState(8);
  const [selectedTime, setSelectedTime] = useState('11:30 AM');

  const handleConfirm = () => {
    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    navigation?.navigate('BookingConfirmation', {
      provider: provider?.name || 'Central Pet Clinic',
      date: `March ${selectedDay}th`,
      time: selectedTime,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.brandGreen} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>JeevSetu</Text>
        <TouchableOpacity>
          <Icon name="cart-outline" size={24} color={COLORS.brandGreen} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

        {/* Select Service */}
        <Text style={styles.sectionTitle}>Select service</Text>
        <View style={styles.serviceRow}>
          {SERVICES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.serviceChip, selectedService === s && styles.serviceChipActive]}
              onPress={() => setSelectedService(s)}
            >
              <Text style={[styles.serviceChipText, selectedService === s && styles.serviceChipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Providers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Providers</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        {PROVIDERS.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.providerCard, selectedProvider === p.id && styles.providerCardActive]}
            onPress={() => setSelectedProvider(p.id)}
            activeOpacity={0.85}
          >
            <View style={styles.providerAvatar}>
              <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{p.name}</Text>
              <View style={styles.ratingRow}>
                <Icon name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>{p.rating} ({p.reviews} reviews)</Text>
              </View>
              <View style={styles.distanceRow}>
                <Icon name="map-marker-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.distanceText}>{p.distance}</Text>
              </View>
            </View>
            {selectedProvider === p.id && (
              <Icon name="check-circle" size={22} color={COLORS.brandGreen} />
            )}
          </TouchableOpacity>
        ))}

        {/* Date Picker */}
        <Text style={styles.sectionTitle}>Choose date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d.date}
              style={[styles.dayCard, selectedDay === d.date && styles.dayCardActive]}
              onPress={() => setSelectedDay(d.date)}
            >
              <Text style={[styles.dayLabel, selectedDay === d.date && styles.dayLabelActive]}>{d.day}</Text>
              <Text style={[styles.dayDate, selectedDay === d.date && styles.dayDateActive]}>{d.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time Slots */}
        <Text style={styles.sectionTitle}>Time slots</Text>
        <View style={styles.timeSlotsGrid}>
          {TIME_SLOTS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
              onPress={() => setSelectedTime(t)}
            >
              <Text style={[styles.timeText, selectedTime === t && styles.timeTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.88}>
          <Text style={styles.confirmBtnText}>Confirm booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5F0EE',
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.brandGreen },
  body: { padding: SPACING.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  seeAll: { fontSize: 12, fontWeight: '700', color: COLORS.brandGreen, letterSpacing: 0.5 },
  serviceRow: { flexDirection: 'row', gap: 10 },
  serviceChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#D1E8E4',
  },
  serviceChipActive: { backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen },
  serviceChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  serviceChipTextActive: { color: COLORS.white },
  providerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5F0EE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  providerCardActive: { borderColor: COLORS.brandGreen, backgroundColor: '#F0FBF9' },
  providerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E6F7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  ratingText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  distanceRow: { flexDirection: 'row', alignItems: 'center' },
  distanceText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  daysRow: { marginBottom: SPACING.sm },
  dayCard: {
    width: 56,
    height: 72,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E5F0EE',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  dayCardActive: { backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen },
  dayLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  dayLabelActive: { color: COLORS.white },
  dayDate: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  dayDateActive: { color: COLORS.white },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#E5F0EE',
    minWidth: '44%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  timeChipActive: { backgroundColor: COLORS.primaryBlue, borderColor: COLORS.primaryBlue },
  timeText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  timeTextActive: { color: COLORS.white, fontWeight: '800' },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  confirmBtn: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  confirmBtnText: { fontSize: 17, fontWeight: '800', color: COLORS.white },
});

export default BookScreen;
