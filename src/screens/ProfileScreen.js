import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'aws-amplify/auth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import { listPets } from '../services/petService';
import { listScans } from '../services/scanHistoryService';
import { SEVERITY_TONE, STATUS_BANNER } from '../services/scanResult';

const TABS = [
  { key: 'health', label: 'Health' },
  { key: 'activity', label: 'Activity' },
  { key: 'history', label: 'History' },
];

const TAB_PLACEHOLDERS = {
  health: { title: 'Vaccination Timeline', body: 'Vaccinations land in Phase 3 #14.' },
  activity: { title: 'Weight & Activity', body: 'Trend chart and activity log land in Phase 4 #17.' },
};

const formatScanDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const topFinding = (scan) => {
  if (scan.result.overallStatus === 'HEALTHY') return null;
  // Highest-confidence finding wins.
  return scan.result.findings.reduce(
    (top, f) => (top == null || f.confidence > top.confidence ? f : top),
    null,
  );
};

const formatDob = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const ageString = (iso) => {
  if (!iso) return '';
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years <= 0) return `${Math.max(months, 0)}m`;
  return `${years}y ${months}m`;
};

const ProfileScreen = ({ navigation }) => {
  const [pets, setPets] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        listPets().catch(() => []),
        listScans().catch(() => []),
      ]).then(([petList, scanList]) => {
        if (!active) return;
        setPets(petList);
        setScans(scanList);
        setLoading(false);
      });
      return () => { active = false; };
    }, [])
  );

  const pet = pets[0];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.center}>
          <Icon name="paw-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>Add your pet</Text>
          <Text style={styles.emptySubtitle}>
            Create a profile to unlock scans, reminders, and bookings.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PetForm')}>
            <Text style={styles.primaryBtnText}>Add a pet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutLink} onPress={() => signOut()}>
            <Text style={styles.signOutLinkText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const placeholder = TAB_PLACEHOLDERS[activeTab];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PetVue</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('PetForm', { petId: pet.id })}
          style={styles.headerBtn}>
          <Icon name="pencil-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <View style={styles.avatarRing}>
            {pet.avatarUri ? (
              <Image source={{ uri: pet.avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="paw" size={32} color={COLORS.brandGreen} />
              </View>
            )}
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petSubtitle}>
            {pet.breed} · {formatDob(pet.dob)}
          </Text>
          <View style={styles.chipRow}>
            <Chip icon="cake-variant-outline" text={ageString(pet.dob)} />
            <Chip icon="scale-bathroom" text={`${pet.weightKg} kg`} />
            <Chip icon="gender-male-female" text={pet.gender} capitalize />
          </View>
        </View>

        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              onPress={() => setActiveTab(t.key)}>
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
              <View style={[styles.tabUnderline, activeTab === t.key && styles.tabUnderlineActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'history' ? (
          <HistoryTabBody
            scans={scans}
            onOpenScan={(scan) => navigation.navigate('ScanResult', {
              result: scan.result,
              heroUri: scan.heroUri,
              imageCount: scan.imageCount,
              totalImageCount: scan.imageCount,
            })}
            onRunScan={() => navigation.navigate('Home', { screen: 'Scan' })}
          />
        ) : (
          <View style={styles.tabBody}>
            <Text style={styles.tabBodyTitle}>{placeholder.title}</Text>
            <Text style={styles.tabBodyText}>{placeholder.body}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.signOutLink} onPress={() => signOut()}>
          <Text style={styles.signOutLinkText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Chip = ({ icon, text, capitalize }) => (
  <View style={styles.chip}>
    <Icon name={icon} size={14} color={COLORS.white} />
    <Text style={[styles.chipText, capitalize && styles.chipTextCapitalize]}>{text}</Text>
  </View>
);

const HistoryTabBody = ({ scans, onOpenScan, onRunScan }) => {
  if (scans.length === 0) {
    return (
      <View style={styles.tabBody}>
        <Icon name="image-search-outline" size={28} color={COLORS.textSecondary} />
        <Text style={styles.tabBodyTitle}>No scans yet</Text>
        <Text style={styles.tabBodyText}>
          Run an AI scan to start a health record. Past scans will land here.
        </Text>
        <TouchableOpacity style={styles.runScanBtn} onPress={onRunScan}>
          <Icon name="creation" size={16} color={COLORS.white} />
          <Text style={styles.runScanBtnText}>Run a scan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.historyList}>
      {scans.map(scan => (
        <ScanHistoryRow key={scan.id} scan={scan} onPress={() => onOpenScan(scan)} />
      ))}
    </View>
  );
};

const ScanHistoryRow = ({ scan, onPress }) => {
  const top = topFinding(scan);
  const banner = STATUS_BANNER[scan.result.overallStatus] ?? STATUS_BANNER.NEEDS_ATTENTION;
  const tone = top ? SEVERITY_TONE[top.severity] : SEVERITY_TONE.HEALTHY;
  return (
    <TouchableOpacity style={styles.historyRow} onPress={onPress} activeOpacity={0.85}>
      {scan.heroUri ? (
        <Image source={{ uri: scan.heroUri }} style={styles.historyThumb} />
      ) : (
        <View style={[styles.historyThumb, styles.historyThumbFallback]}>
          <Icon name="image-outline" size={20} color={COLORS.textSecondary} />
        </View>
      )}
      <View style={styles.historyText}>
        <View style={styles.historyTitleRow}>
          <Text style={styles.historyTitle} numberOfLines={1}>
            {top ? top.condition : 'Looks healthy'}
          </Text>
          <View style={[styles.historyStatusPill, { backgroundColor: banner.bg }]}>
            <Text style={[styles.historyStatusText, { color: banner.tone }]}>{banner.label}</Text>
          </View>
        </View>
        <Text style={styles.historyDate}>{formatScanDate(scan.createdAt)}</Text>
        {top ? (
          <Text style={[styles.historyConfidence, { color: tone.fg }]}>
            {tone.label} · {top.confidence}% confidence
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.md },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: SPACING.xs, marginBottom: SPACING.lg, paddingHorizontal: SPACING.md,
  },
  primaryBtn: {
    backgroundColor: COLORS.brandGreen,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.brandGreen,
  },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: 18, fontWeight: '700' },
  headerBtn: { padding: SPACING.xs },
  scroll: { paddingBottom: SPACING.xxl },
  heroCard: {
    backgroundColor: COLORS.primaryBlue,
    margin: SPACING.md,
    borderRadius: 24,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.white },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  petName: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  petSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.9, marginTop: 2 },
  chipRow: { flexDirection: 'row', marginTop: SPACING.md, gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  chipTextCapitalize: { textTransform: 'capitalize' },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm },
  tabLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.brandGreen },
  tabUnderline: { height: 2, width: '100%', backgroundColor: 'transparent', marginTop: 6 },
  tabUnderlineActive: { backgroundColor: COLORS.brandGreen },
  tabBody: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  tabBodyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.xs, marginBottom: SPACING.xs, textAlign: 'center' },
  tabBodyText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, textAlign: 'center' },

  runScanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.brandGreen,
    paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderRadius: 12, marginTop: SPACING.md,
  },
  runScanBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  historyList: { marginHorizontal: SPACING.md, marginTop: SPACING.sm },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  historyThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: COLORS.inputBackground },
  historyThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  historyText: { flex: 1 },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  historyTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  historyStatusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  historyStatusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  historyDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  historyConfidence: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  signOutLink: { alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.md },
  signOutLinkText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});

export default ProfileScreen;
