// ─── AnimalRosterScreen ───────────────────────────────────────────────────────
// Searchable, filterable list of all animals in the shelter.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listAnimals } from '../services/animalService';
import AnimalCard from '../components/AnimalCard';

// ── Filter config ─────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'critical',  label: '🚨 Critical', type: 'health' },
  { key: 'dog',       label: '🐕 Dogs',     type: 'species' },
  { key: 'cat',       label: '🐈 Cats',     type: 'species' },
  { key: 'cow',       label: '🐄 Cattle',   type: 'species' },
  { key: 'available', label: '✅ Available', type: 'status' },
  { key: 'fostered',  label: '🏠 Fostered', type: 'status' },
  { key: 'medical_hold', label: '💊 Medical', type: 'status' },
];

const applyActiveFilter = (animals, activeKey) => {
  if (activeKey === 'all') return animals;
  const f = FILTERS.find(f => f.key === activeKey);
  if (!f) return animals;
  if (f.type === 'species')  return animals.filter(a => a.species === activeKey);
  if (f.type === 'status')   return animals.filter(a => a.status === activeKey);
  if (activeKey === 'critical') return animals.filter(a => a.healthStatus === 'critical' || a.healthStatus === 'needs_attention');
  return animals;
};

// ── Filter Chip ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const AnimalRosterScreen = ({ navigation }) => {
  const [allAnimals, setAllAnimals] = useState([]);
  const [search, setSearch]         = useState('');
  const [activeFilter, setFilter]   = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await listAnimals();
      setAllAnimals(data);
    } catch (e) {
      console.warn('AnimalRoster load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Apply search then filter
  const displayed = applyActiveFilter(
    allAnimals.filter(a => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        a.name?.toLowerCase().includes(q) ||
        a.caseId.toLowerCase().includes(q) ||
        a.breed?.toLowerCase().includes(q) ||
        a.species.toLowerCase().includes(q)
      );
    }),
    activeFilter,
  );

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const ListHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Animals</Text>
          <Text style={styles.subtitle}>{allAnimals.length} total in shelter</Text>
        </View>
        <TouchableOpacity
          style={styles.intakeBtn}
          onPress={() => navigation.navigate('AnimalIntake')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={18} color={COLORS.textOnBrand} />
          <Text style={styles.intakeBtnText}>New Intake</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Icon name="magnify" size={20} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, case ID, or species…"
          placeholderTextColor={COLORS.placeholder}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={f => f.key}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <FilterChip
            label={item.label}
            active={activeFilter === item.key}
            onPress={() => setFilter(item.key)}
          />
        )}
        style={styles.filterScroll}
      />

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {displayed.length === allAnimals.length
          ? `${allAnimals.length} animals`
          : `${displayed.length} of ${allAnimals.length} animals`}
      </Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="paw-off" size={52} color={COLORS.border} />
      <Text style={styles.emptyTitle}>
        {search || activeFilter !== 'all' ? 'No matching animals' : 'No animals yet'}
      </Text>
      <Text style={styles.emptySub}>
        {search || activeFilter !== 'all'
          ? 'Try a different search or filter'
          : 'Register your first rescued animal using the "New Intake" button above.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={displayed}
        keyExtractor={a => a.id}
        renderItem={({ item }) => (
          <AnimalCard
            animal={item}
            onPress={() => navigation.navigate('AnimalDetail', { animalId: item.id })}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // ── Performance tuning for 100+ animals ──────────────────────────
        initialNumToRender={15}        // Only render first 15 on mount
        maxToRenderPerBatch={10}       // Render 10 more per JS frame
        windowSize={10}                // Keep 5 screens above+below in memory
        removeClippedSubviews={true}   // Unmount off-screen items (iOS)
        updateCellsBatchingPeriod={30} // Batch render updates (ms)
        // ─────────────────────────────────────────────────────────────────
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />
        }
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  title:    { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  intakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    ...SHADOW.card,
  },
  intakeBtnText: { color: COLORS.textOnBrand, fontWeight: '700', fontSize: 13 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    ...SHADOW.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },

  filterScroll: { marginBottom: SPACING.sm },
  filterList:   { gap: SPACING.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive:     { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText:       { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.textOnBrand },

  resultsCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptySub:   {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
  },
});

export default AnimalRosterScreen;
