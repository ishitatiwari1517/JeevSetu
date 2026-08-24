// ─── PeopleHomeScreen ─────────────────────────────────────────────────────────
// Hub screen for the People tab — Volunteer management only.
// (Adoption showcase moved to the dedicated Adoption tab)

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listVolunteers, getVolunteerStats } from '../services/volunteerService';
import { getOrganization } from '../services/orgService';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, color, bg, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.75}>
    <Icon name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Section button ─────────────────────────────────────────────────────────────
const SectionBtn = ({ icon, title, subtitle, color, bg, onPress, badge }) => (
  <TouchableOpacity style={styles.sectionBtn} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.sectionIcon, { backgroundColor: bg }]}>
      <Icon name={icon} size={26} color={color} />
    </View>
    <View style={styles.sectionInfo}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
    {badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

// ── Volunteer preview card ─────────────────────────────────────────────────────
const VolPreviewCard = ({ vol, onPress }) => (
  <TouchableOpacity style={styles.volCard} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.volAvatar, { backgroundColor: COLORS.brandLight }]}>
      <Text style={styles.volAvatarText}>{vol.name.charAt(0).toUpperCase()}</Text>
    </View>
    <View style={styles.volInfo}>
      <Text style={styles.volName}>{vol.name}</Text>
      <Text style={styles.volSub}>{vol.phone}</Text>
    </View>
    <View style={[styles.volStatus, { backgroundColor: vol.status === 'active' ? COLORS.healthyBg : COLORS.neutralBg }]}>
      <Text style={[styles.volStatusText, { color: vol.status === 'active' ? COLORS.healthy : COLORS.neutral }]}>
        {vol.status}
      </Text>
    </View>
  </TouchableOpacity>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const PeopleHomeScreen = ({ navigation }) => {
  const [volStats, setVolStats]     = useState({ total: 0, active: 0, canFoster: 0, canRescue: 0 });
  const [recentVols, setRecentVols] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const org = await getOrganization();
      const oid = org?.id || 'default';
      const [vs, vols] = await Promise.all([
        getVolunteerStats(oid),
        listVolunteers(oid),
      ]);
      setVolStats(vs);
      setRecentVols(vols.slice(0, 4));
    } catch (e) {
      console.warn('PeopleHome load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = () => { setRefreshing(true); loadData(); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>People</Text>
          <Text style={styles.subtitle}>Volunteer management</Text>
        </View>

        {/* ── Volunteer stats ─────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>VOLUNTEERS</Text>
        <View style={styles.statsRow}>
          <StatCard icon="account-group"  value={volStats.total}     label="Total"   color={COLORS.brand}    bg={COLORS.brandLight}  onPress={() => navigation.navigate('VolunteerList')} />
          <StatCard icon="account-check"  value={volStats.active}    label="Active"  color={COLORS.healthy}  bg={COLORS.healthyBg}   onPress={() => navigation.navigate('VolunteerList')} />
          <StatCard icon="home-heart"     value={volStats.canFoster} label="Fosters" color="#7C3AED"         bg="#EDE9FE"            onPress={() => navigation.navigate('VolunteerList')} />
          <StatCard icon="ambulance"      value={volStats.canRescue} label="Rescue"  color={COLORS.attention} bg={COLORS.attentionBg} onPress={() => navigation.navigate('VolunteerList')} />
        </View>

        <SectionBtn
          icon="account-group"
          title="All Volunteers"
          subtitle={`${volStats.total} registered volunteer${volStats.total !== 1 ? 's' : ''}`}
          color={COLORS.brand} bg={COLORS.brandLight}
          onPress={() => navigation.navigate('VolunteerList')}
          badge={0}
        />
        <SectionBtn
          icon="account-plus"
          title="Add Volunteer"
          subtitle="Register a new volunteer"
          color={COLORS.healthy} bg={COLORS.healthyBg}
          onPress={() => navigation.navigate('AddVolunteer')}
          badge={0}
        />
        <SectionBtn
          icon="pill"
          title="Medication Schedule"
          subtitle="Today's medication rounds"
          color={COLORS.attention} bg={COLORS.attentionBg}
          onPress={() => navigation.navigate('MedicationSchedule')}
          badge={0}
        />

        {/* Recent volunteers */}
        {recentVols.length > 0 && (
          <>
            <View style={styles.subHeader}>
              <Text style={styles.subHeaderText}>Recent Volunteers</Text>
              <TouchableOpacity onPress={() => navigation.navigate('VolunteerList')}>
                <Text style={styles.subHeaderAction}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentVols.map(v => (
              <VolPreviewCard
                key={v.id}
                vol={v}
                onPress={() => navigation.navigate('VolunteerDetail', { volunteerId: v.id })}
              />
            ))}
          </>
        )}

        {recentVols.length === 0 && (
          <View style={styles.empty}>
            <Icon name="account-group-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No volunteers yet</Text>
            <Text style={styles.emptySub}>Tap "Add Volunteer" to register your first team member.</Text>
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
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },

  header:   { paddingTop: SPACING.md, marginBottom: SPACING.md },
  title:    { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.8, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, gap: 3 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },

  sectionBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card },
  sectionIcon: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sectionInfo: { flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sectionSub:   { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  badge: { backgroundColor: COLORS.critical, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  subHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: SPACING.sm },
  subHeaderText:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  subHeaderAction: { fontSize: 12, color: COLORS.brand, fontWeight: '600' },

  volCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card },
  volAvatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  volAvatarText: { fontSize: 18, fontWeight: '700', color: COLORS.brand },
  volInfo:       { flex: 1 },
  volName:       { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  volSub:        { fontSize: 12, color: COLORS.textSecondary },
  volStatus:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  volStatusText: { fontSize: 10, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 40, gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});

export default PeopleHomeScreen;
