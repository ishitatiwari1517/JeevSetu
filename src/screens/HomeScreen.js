import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import { listPets } from '../services/petService';
import { listUpcomingReminders } from '../services/reminderService';
import { formatReminderTime } from './home.format';

// Sample affiliate products until the marketplace service (#18) lands.
// Tapping a card sends the user to the Shop tab where the real catalog will live.
const SAMPLE_PRODUCTS = [
  { id: 'p1', name: 'Organic Beef Kibble', price: '$24.99', color: '#3D2918' },
  { id: 'p2', name: 'Leather Leash',       price: '$18.50', color: '#1F2937' },
];

const REMINDER_VISUAL = {
  vaccination: { icon: 'needle',          tint: '#FCE7E7', accent: '#B53636' },
  appointment: { icon: 'calendar-clock',  tint: '#E1F0FA', accent: '#1F6A99' },
  grooming:    { icon: 'content-cut',     tint: '#FFF3D6', accent: '#A77410' },
};

const ageString = (dobIso) => {
  if (!dobIso) return '';
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0) return `${Math.max(months, 0)}m`;
  return `${years}y ${months}m`;
};

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('Pet Guardian');
  const [pets, setPets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    fetchUserAttributes()
      .then(attrs => {
        if (attrs.name) setUserName(attrs.name.split(' ')[0]);
        else if (attrs.email) setUserName(attrs.email.split('@')[0]);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoadingPets(true);
      Promise.all([
        listPets().catch(() => []),
        listUpcomingReminders().catch(() => []),
      ]).then(([petList, reminderList]) => {
        if (!active) return;
        setPets(petList);
        setReminders(reminderList);
        setLoadingPets(false);
      });
      return () => { active = false; };
    }, [])
  );

  const primaryPet = pets[0];
  const subtitle = primaryPet
    ? `Your sanctuary for ${primaryPet.name}'s happiness.`
    : "Your sanctuary for your pet's happiness.";

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Good morning, {userName} 👋</Text>
            <Text style={styles.subgreeting}>{subtitle}</Text>
          </View>
          <TouchableOpacity onPress={() => signOut()} style={styles.signOutBtn}>
            <Icon name="logout" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.petCard}
          onPress={() => navigation.navigate(
            'Profile',
            primaryPet ? undefined : { screen: 'PetForm' },
          )}>
          {loadingPets ? (
            <Text style={styles.petCardMeta}>Loading…</Text>
          ) : primaryPet ? (
            <>
              <View style={styles.petCardTopRow}>
                <Text style={styles.petCardName}>{primaryPet.name}</Text>
                <View style={styles.healthPill}>
                  <Icon name="check-circle" size={12} color={COLORS.brandGreen} />
                  <Text style={styles.healthPillText}>Healthy</Text>
                </View>
              </View>
              <Text style={styles.petCardMeta}>
                {ageString(primaryPet.dob)} {primaryPet.breed}
              </Text>
              <Text style={styles.petCardWeight}>{primaryPet.weightKg}kg</Text>
            </>
          ) : (
            <>
              <Text style={styles.petCardName}>Add your pet</Text>
              <Text style={styles.petCardMeta}>Tap to create a profile</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <QuickAction icon="account-circle-outline" label="PROFILE" onPress={() => navigation.navigate('Profile')} />
          <QuickAction icon="camera-iris"            label="AI SCAN" onPress={() => navigation.navigate('Scan')} />
          <QuickAction icon="storefront-outline"     label="SHOP"    onPress={() => navigation.navigate('Shop')} />
          <QuickAction icon="calendar-blank-outline" label="BOOK"    onPress={() => navigation.navigate('Book')} />
        </View>

        <SectionHeader
          title="Upcoming reminders"
          actionLabel={reminders.length > 0 ? 'View all' : null}
          onAction={() => navigation.navigate('Book')}
        />
        {reminders.length === 0 ? (
          <View style={styles.emptyReminders}>
            <Icon name="calendar-check-outline" size={28} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No upcoming reminders</Text>
            <Text style={styles.emptyBody}>
              Book a checkup or add a vaccination to start tracking.
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => navigation.navigate('Book')}>
              <Text style={styles.emptyCtaText}>Book a visit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reminders.map(r => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onPress={() => navigation.navigate('Book')}
            />
          ))
        )}

        <SectionHeader
          title="Recommended products"
          actionLabel="View all"
          onAction={() => navigation.navigate('Shop')}
        />
        <View style={styles.productsRow}>
          {SAMPLE_PRODUCTS.map(p => (
            <ProductCard key={p.id} product={p} onPress={() => navigation.navigate('Shop')} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.qa} onPress={onPress}>
    <View style={styles.qaIconWrap}>
      <Icon name={icon} size={22} color={COLORS.brandGreen} />
    </View>
    <Text style={styles.qaLabel}>{label}</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel ? (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const ReminderCard = ({ reminder, onPress }) => {
  const visual = REMINDER_VISUAL[reminder.kind] ?? REMINDER_VISUAL.appointment;
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.reminderCard} onPress={onPress}>
      <View style={[styles.reminderIconWrap, { backgroundColor: visual.tint }]}>
        <Icon name={visual.icon} size={20} color={visual.accent} />
      </View>
      <View style={styles.reminderTextCol}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <Text style={styles.reminderTime}>{formatReminderTime(reminder.dueAt)}</Text>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

const ProductCard = ({ product, onPress }) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.productImage, { backgroundColor: product.color }]}>
      <Icon name="package-variant" size={32} color="rgba(255,255,255,0.6)" />
    </View>
    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
    <Text style={styles.productPrice}>{product.price}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  headerText: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  subgreeting: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  signOutBtn: { padding: SPACING.sm },

  petCard: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  petCardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  petCardName: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
  healthPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  healthPillText: { color: COLORS.brandGreen, fontSize: 12, fontWeight: '700' },
  petCardMeta: { color: COLORS.white, opacity: 0.85, marginTop: 6, fontSize: 14 },
  petCardWeight: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginTop: 4 },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  qa: { alignItems: 'center', flex: 1 },
  qaIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  qaLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  sectionAction: { fontSize: 13, fontWeight: '600', color: COLORS.brandGreen },

  emptyReminders: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.sm },
  emptyBody: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: SPACING.md },
  emptyCta: {
    backgroundColor: COLORS.brandGreen,
    paddingHorizontal: SPACING.lg, paddingVertical: 10, borderRadius: 10,
  },
  emptyCtaText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  reminderCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md,
  },
  reminderIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  reminderTextCol: { flex: 1 },
  reminderTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  reminderTime: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  productsRow: { flexDirection: 'row', gap: SPACING.md },
  productCard: { flex: 1 },
  productImage: {
    aspectRatio: 1, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  productName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  productPrice: { fontSize: 14, fontWeight: '700', color: COLORS.brandGreen, marginTop: 2 },
});

export default HomeScreen;
