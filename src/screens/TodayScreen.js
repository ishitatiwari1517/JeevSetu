// ─── TodayScreen — Shelter Dashboard ─────────────────────────────────────────
// The operational heartbeat of the shelter. Shows today's alerts, stats, and tasks.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Image, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { signOut } from 'aws-amplify/auth';
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

const SPECIES_ICON = {
  dog: 'dog', cat: 'cat', cow: 'cow', buffalo: 'cow',
  bird: 'bird', rabbit: 'rabbit', horse: 'horse-variant', other: 'paw',
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

// ── Animal Picker Modal ────────────────────────────────────────────────────────
const AnimalPickerModal = ({ visible, animals, onSelect, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
    <View style={styles.modalSheet}>
      <View style={styles.modalHandle} />
      <Text style={styles.modalTitle}>Select Animal to Scan</Text>
      <Text style={styles.modalSubtitle}>The scan will be saved to this animal's history</Text>

      {animals.length === 0 ? (
        <View style={styles.modalEmpty}>
          <Icon name="paw-outline" size={36} color={COLORS.border} />
          <Text style={styles.modalEmptyText}>No animals in shelter yet</Text>
        </View>
      ) : (
        <FlatList
          data={animals}
          keyExtractor={a => a.id}
          style={styles.modalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.animalRow}
              onPress={() => onSelect(item)}
              activeOpacity={0.75}
            >
              <View style={styles.animalRowIcon}>
                <Icon
                  name={SPECIES_ICON[item.species] || 'paw'}
                  size={20}
                  color={COLORS.brand}
                />
              </View>
              <View style={styles.animalRowInfo}>
                <Text style={styles.animalRowName}>{item.name || 'Unknown Animal'}</Text>
                <Text style={styles.animalRowMeta}>{item.caseId} · {item.species}</Text>
              </View>
              <View style={[
                styles.animalRowHealth,
                { backgroundColor: item.healthStatus === 'critical' ? COLORS.criticalBg : item.healthStatus === 'needs_attention' ? COLORS.attentionBg : COLORS.healthyBg }
              ]}>
                <Text style={[
                  styles.animalRowHealthText,
                  { color: item.healthStatus === 'critical' ? COLORS.critical : item.healthStatus === 'needs_attention' ? COLORS.attention : COLORS.healthy }
                ]}>
                  {(item.healthStatus || 'stable').replace(/_/g, ' ')}
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
        <Text style={styles.modalCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const TodayScreen = ({ navigation }) => {
  const [orgName, setOrgName]           = useState('Your Shelter');
  const [stats, setStats]               = useState({ total: 0, critical: 0, available: 0, needsAttention: 0 });
  const [alertAnimals, setAlertAnimals] = useState([]);
  const [allAnimals, setAllAnimals]     = useState([]);
  const [refreshing, setRefreshing]     = useState(false);
  const [loading, setLoading]           = useState(true);
  const [scanPickerVisible, setScanPickerVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [org, statsData, animals] = await Promise.all([
        getOrganization(),
        getAnimalStats(),
        listAnimals(),
      ]);
      if (org?.name) setOrgName(org.name);
      setStats(statsData);
      setAllAnimals(animals);
      setAlertAnimals(
        animals.filter(a => a.healthStatus === 'critical' || a.healthStatus === 'needs_attention'),
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
    try { await signOut(); } catch (e) { console.warn('Logout error', e); }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleAnimalSelected = (animal) => {
    setScanPickerVisible(false);
    navigation.navigate('Scan', { animalId: animal.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Animal Picker Modal ─────────────────────────────────────────── */}
      <AnimalPickerModal
        visible={scanPickerVisible}
        animals={allAnimals}
        onSelect={handleAnimalSelected}
        onClose={() => setScanPickerVisible(false)}
      />

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
            onPress={() => setScanPickerVisible(true)}
          />
          <QuickAction
            icon="qrcode-scan"  label="Scan QR"
            color="#0369A1"         bg="#E0F2FE"
            onPress={() => navigation.navigate('QRScanner')}
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard:  { flex: 1, minWidth: '45%', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'flex-start', gap: 4 },
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm, borderLeftWidth: 3,
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

  // Animal Picker Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:     {
    backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl, maxHeight: '75%',
  },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginVertical: SPACING.sm },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.sm },
  modalSubtitle:  { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.md },
  modalList:      { maxHeight: 380 },
  modalEmpty:     { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  modalEmptyText: { fontSize: 14, color: COLORS.textSecondary },
  modalCancel:    { marginTop: SPACING.md, alignItems: 'center', paddingVertical: SPACING.sm },
  modalCancelText:{ fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },

  // Animal row in picker
  animalRow:           { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  animalRowIcon:       { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center' },
  animalRowInfo:       { flex: 1 },
  animalRowName:       { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  animalRowMeta:       { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  animalRowHealth:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  animalRowHealthText: { fontSize: 10, fontWeight: '700' },
});

export default TodayScreen;

