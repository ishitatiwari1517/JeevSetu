// ─── TodayScreen — Shelter Dashboard ─────────────────────────────────────────
// The operational heartbeat of the shelter. Shows today's alerts, stats, and tasks.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listAnimals, getAnimalStats } from '../services/animalService';
import { getOrganization } from '../services/orgService';

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
};

const greetingText = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color, bg }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <Icon name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ── Alert Card ────────────────────────────────────────────────────────────────
const AlertCard = ({ animal, onPress }) => {
  const isUrgent = animal.healthStatus === 'critical';
  return (
    <TouchableOpacity
      style={[styles.alertCard, { borderLeftColor: isUrgent ? COLORS.critical : COLORS.attention }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.alertDot, { backgroundColor: isUrgent ? COLORS.critical : COLORS.attention }]} />
      <View style={styles.alertInfo}>
        <Text style={styles.alertName}>{animal.name || 'Unknown'} · {animal.caseId}</Text>
        <Text style={styles.alertSub}>
          {isUrgent ? '🚨 Critical condition' : '⚠️ Needs attention'} · {animal.species}
        </Text>
      </View>
      <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

// ── Quick Action Button ────────────────────────────────────────────────────────
const QuickAction = ({ icon, label, color, bg, onPress }) => (
  <TouchableOpacity style={[styles.quickAction, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
    <Icon name={icon} size={24} color={color} />
    <Text style={[styles.quickLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ── Section Header ─────────────────────────────────────────────────────────────
const SectionHeader = ({ title, count, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{count}</Text>
        </View>
      )}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const TodayScreen = ({ navigation }) => {
  const [orgName, setOrgName]       = useState('Your Shelter');
  const [stats, setStats]           = useState({ total: 0, critical: 0, available: 0, needsAttention: 0 });
  const [alertAnimals, setAlertAnimals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading]       = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [org, statsData, allAnimals] = await Promise.all([
        getOrganization(),
        getAnimalStats(),
        listAnimals(),
      ]);
      if (org?.name) setOrgName(org.name);
      setStats(statsData);
      setAlertAnimals(
        allAnimals.filter(a => a.healthStatus === 'critical' || a.healthStatus === 'needs_attention'),
      );
    } catch (e) {
      console.warn('TodayScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Logout error', e);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greetingText()}</Text>
            <Text style={styles.orgName}>{orgName}</Text>
            <Text style={styles.dateText}>{todayLabel()}</Text>
          </View>
          <View style={styles.headerRight}>
            <Image
              source={require('../assets/petvue_logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Icon name="logout" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <StatCard icon="paw"            value={stats.total}          label="Total Animals" color={COLORS.brand}     bg={COLORS.brandLight} />
          <StatCard icon="alert-circle"   value={stats.critical}       label="Critical"      color={COLORS.critical}  bg={COLORS.criticalBg} />
          <StatCard icon="heart-check"    value={stats.available}      label="Available"     color={COLORS.healthy}   bg={COLORS.healthyBg} />
          <StatCard icon="eye-alert"      value={stats.needsAttention} label="Need Attention" color={COLORS.attention} bg={COLORS.attentionBg} />
        </View>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickRow}>
          <QuickAction
            icon="plus-circle"  label="New Intake"
            color={COLORS.brand}    bg={COLORS.brandLight}
            onPress={() => navigation.navigate('Animals', { screen: 'AnimalIntake' })}
          />
          <QuickAction
            icon="camera"       label="AI Scan"
            color="#7C3AED"         bg="#EDE9FE"
            onPress={() => navigation.navigate('Scan')}
          />
          <QuickAction
            icon="pill"         label="Medications"
            color={COLORS.attention} bg={COLORS.attentionBg}
            onPress={() => navigation.navigate('MedicationSchedule')}
          />
          <QuickAction
            icon="clipboard-list" label="All Animals"
            color={COLORS.healthy}  bg={COLORS.healthyBg}
            onPress={() => navigation.navigate('Animals')}
          />
        </View>

        {/* ── Alerts ──────────────────────────────────────────────────────── */}
        {alertAnimals.length > 0 && (
          <>
            <SectionHeader
              title="Health Alerts"
              count={alertAnimals.length}
              action="See all"
              onAction={() => navigation.navigate('Animals')}
            />
            {alertAnimals.slice(0, 5).map(animal => (
              <AlertCard
                key={animal.id}
                animal={animal}
                onPress={() => navigation.navigate('AnimalDetail', { animalId: animal.id })}
              />
            ))}
          </>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!loading && stats.total === 0 && (
          <View style={styles.emptyState}>
            <Icon name="paw" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No animals yet</Text>
            <Text style={styles.emptySub}>
              Tap "New Intake" to register your first rescued animal.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Animals', { screen: 'AnimalIntake' })}
            >
              <Icon name="plus" size={18} color={COLORS.textOnBrand} />
              <Text style={styles.emptyButtonText}>Register First Animal</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  logoutBtn:    { padding: 8, backgroundColor: COLORS.surface, borderRadius: RADIUS.full, ...SHADOW.card },
  greeting:     { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', letterSpacing: 0.3 },
  orgName:      { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  dateText:     { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  logo:         { width: 52, height: 52, borderRadius: RADIUS.md },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'flex-start',
    gap: 4,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  // Section
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sectionBadge:    { backgroundColor: COLORS.criticalBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  sectionBadgeText:{ fontSize: 11, fontWeight: '700', color: COLORS.critical },
  sectionAction:   { fontSize: 13, color: COLORS.brand, fontWeight: '600' },

  // Quick Actions
  quickRow:    { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  quickAction: { flex: 1, alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.lg, gap: 6 },
  quickLabel:  { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  // Alert cards
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    ...SHADOW.card,
  },
  alertDot:  { width: 8, height: 8, borderRadius: 4, marginRight: SPACING.sm },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  alertSub:  { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Empty
  emptyState:      { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptySub:        { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.lg },
  emptyButton:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.brand, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, marginTop: SPACING.sm },
  emptyButtonText: { color: COLORS.textOnBrand, fontWeight: '700', fontSize: 14 },
});

export default TodayScreen;
