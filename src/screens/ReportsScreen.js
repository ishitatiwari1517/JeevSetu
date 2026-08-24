// ─── ReportsScreen — Phase 4 Full Implementation ─────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listAnimals } from '../services/animalService';
import { listVolunteers } from '../services/volunteerService';
import { getAdoptionStats } from '../services/adoptionService';
import { getOrganization } from '../services/orgService';

// ── Report types (all now active) ─────────────────────────────────────────────
const REPORT_TYPES = [
  {
    key: 'animal_status',
    icon: 'paw',
    title: 'Animal Status Report',
    desc: 'Current snapshot — counts by species, status, and health.',
    color: COLORS.brand, bg: COLORS.brandLight,
    screen: 'AnimalStatusReport',
  },
  {
    key: 'intake_outcome',
    icon: 'swap-vertical',
    title: 'Intake & Outcome',
    desc: 'Monthly intakes, adoptions, transfers and deceased.',
    color: COLORS.healthy, bg: COLORS.healthyBg,
    screen: 'IntakeOutcomeReport',
  },
  {
    key: 'vaccination',
    icon: 'needle',
    title: 'Vaccination Report',
    desc: 'Animals due or overdue for vaccinations.',
    color: COLORS.attention, bg: COLORS.attentionBg,
    screen: 'VaccinationReport',
  },
  {
    key: 'volunteer_hours',
    icon: 'account-group',
    title: 'Volunteer Hours',
    desc: 'Hours per volunteer — for donor transparency.',
    color: '#0891B2', bg: '#E0F2FE',
    screen: 'VolunteerHoursReport',
  },
  {
    key: 'adoption_pipeline',
    icon: 'heart-circle',
    title: 'Adoption Pipeline',
    desc: 'Applications by status, average time, and success rate.',
    color: '#7C3AED', bg: '#EDE9FE',
    screen: 'AdoptionPipelineReport',
  },
];

const StatPill = ({ label, value, color }) => (
  <View style={[styles.statPill, { borderColor: color + '33', backgroundColor: color + '10' }]}>
    <Text style={[styles.statPillValue, { color }]}>{value}</Text>
    <Text style={styles.statPillLabel}>{label}</Text>
  </View>
);

const ReportCard = ({ report, onPress }) => (
  <TouchableOpacity style={styles.reportCard} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.reportIconWrap, { backgroundColor: report.bg }]}>
      <Icon name={report.icon} size={22} color={report.color} />
    </View>
    <View style={styles.reportInfo}>
      <Text style={styles.reportTitle}>{report.title}</Text>
      <Text style={styles.reportDesc}>{report.desc}</Text>
    </View>
    <Icon name="chevron-right" size={20} color={report.color} />
  </TouchableOpacity>
);

const ReportsScreen = ({ navigation }) => {
  const [stats, setStats]         = useState({ total: 0, available: 0, critical: 0, adopted: 0 });
  const [volCount, setVolCount]   = useState(0);
  const [adoptStats, setAdoptStats] = useState({ submitted: 0, underReview: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [orgId, setOrgId]         = useState('default');

  const loadData = useCallback(async () => {
    try {
      const org = await getOrganization();
      const oid = org?.id || 'default';
      setOrgId(oid);
      const [animals, vols, as] = await Promise.all([
        listAnimals(),
        listVolunteers(oid),
        getAdoptionStats(oid),
      ]);
      setStats({
        total:     animals.length,
        available: animals.filter(a => a.status === 'available').length,
        critical:  animals.filter(a => a.healthStatus === 'critical').length,
        adopted:   animals.filter(a => a.status === 'adopted').length,
      });
      setVolCount(vols.filter(v => v.status === 'active').length);
      setAdoptStats(as);
    } catch (e) {
      console.warn('Reports load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleReport = (report) => {
    navigation.navigate(report.screen, { orgId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.brand} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Live data insights & exportable reports</Text>
        </View>

        {/* Live stats */}
        <View style={styles.statsRow}>
          <StatPill label="Total"     value={stats.total}     color={COLORS.brand} />
          <StatPill label="Available" value={stats.available} color={COLORS.healthy} />
          <StatPill label="Critical"  value={stats.critical}  color={COLORS.critical} />
          <StatPill label="Adopted"   value={stats.adopted}   color="#7C3AED" />
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.brandLight }]}>
            <Icon name="account-group" size={20} color={COLORS.brand} />
            <Text style={[styles.summaryValue, { color: COLORS.brand }]}>{volCount}</Text>
            <Text style={styles.summaryLabel}>Active Volunteers</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EDE9FE' }]}>
            <Icon name="clipboard-text" size={20} color="#7C3AED" />
            <Text style={[styles.summaryValue, { color: '#7C3AED' }]}>{adoptStats.submitted + adoptStats.underReview}</Text>
            <Text style={styles.summaryLabel}>Pending Adoptions</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>AVAILABLE REPORTS</Text>

        {REPORT_TYPES.map(r => (
          <ReportCard key={r.key} report={r} onPress={() => handleReport(r)} />
        ))}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  header:  { paddingTop: SPACING.md, marginBottom: SPACING.md },
  title:   { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle:{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, borderWidth: 1 },
  statPillValue: { fontSize: 20, fontWeight: '800' },
  statPillLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  summaryCard: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.8, marginBottom: SPACING.sm },
  reportCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card },
  reportIconWrap: { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  reportDesc:  { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
});

export default ReportsScreen;
