// ─── MedicationScheduleScreen ─────────────────────────────────────────────────
// Daily view of all active medications across every animal in the shelter.
// Field workers use this as their medication round checklist.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listAnimals } from '../services/animalService';
import { listAllMedicalRecordsByAnimal } from '../services/medicalRecordService';
import { getOrganization } from '../services/orgService';

const SPECIES_ICON = {
  dog: 'dog', cat: 'cat', cow: 'cow', buffalo: 'cow',
  bird: 'bird', rabbit: 'rabbit', horse: 'horse-variant', other: 'paw',
};

// Given list of medical records, extract all active medication entries
const extractActiveMedications = (animals, recordsByAnimalId) => {
  const today = new Date();
  const result = [];

  for (const animal of animals) {
    const records = recordsByAnimalId[animal.id] || [];
    for (const record of records) {
      if (!record.medications?.length) continue;
      for (const med of record.medications) {
        // Include if no end date (ongoing) or end date in the future
        const ended = med.endDate && new Date(med.endDate) < today;
        if (!ended) {
          result.push({
            id: `${record.id}_${med.name}`,
            animalId: animal.id,
            animalName: animal.name || 'Unknown',
            animalCaseId: animal.caseId,
            animalSpecies: animal.species,
            medicationName: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            startDate: med.startDate,
            endDate: med.endDate,
            notes: med.notes,
            recordTitle: record.title,
          });
        }
      }
    }
  }

  // Sort by animal name
  return result.sort((a, b) => a.animalName.localeCompare(b.animalName));
};

// ── Medication Card ────────────────────────────────────────────────────────────
const MedCard = ({ item, onAnimalPress }) => {
  const speciesIcon = SPECIES_ICON[item.animalSpecies] || 'paw';

  return (
    <TouchableOpacity style={styles.medCard} onPress={onAnimalPress} activeOpacity={0.75}>
      <View style={[styles.medIconWrap, { backgroundColor: COLORS.attentionBg }]}>
        <Icon name="pill" size={22} color={COLORS.attention} />
      </View>
      <View style={styles.medInfo}>
        <View style={styles.medRow}>
          <Text style={styles.medName}>{item.medicationName}</Text>
          <Text style={styles.medDosage}>{item.dosage}</Text>
        </View>
        <Text style={styles.medFrequency}>
          <Icon name="clock-outline" size={11} /> {item.frequency}
        </Text>
        <TouchableOpacity style={styles.animalTag} onPress={onAnimalPress}>
          <Icon name={speciesIcon} size={12} color={COLORS.brand} />
          <Text style={styles.animalTagText}>{item.animalName} · {item.animalCaseId}</Text>
        </TouchableOpacity>
        {item.endDate && (
          <Text style={styles.endDate}>
            Until {new Date(item.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        )}
      </View>
      <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────
const MedicationScheduleScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [refreshing, setRefreshing]   = useState(false);
  const [loading, setLoading]         = useState(true);

  const loadData = useCallback(async () => {
    try {
      const org = await getOrganization();
      const orgId = org?.id || 'default';

      // OPTIMIZED: single AsyncStorage read instead of N reads (one per animal)
      // This keeps MedicationSchedule fast with 100+ animals
      const [animals, recordsByAnimalId] = await Promise.all([
        listAnimals(),
        listAllMedicalRecordsByAnimal(orgId),
      ]);

      setMedications(extractActiveMedications(animals, recordsByAnimalId));
    } catch (e) {
      console.warn('MedicationSchedule load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = () => { setRefreshing(true); loadData(); };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.title}>Medication Schedule</Text>
          <Text style={styles.subtitle}>{today}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{medications.length}</Text>
        </View>
      </View>

      {medications.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Icon name="pill" size={52} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No active medications</Text>
          <Text style={styles.emptySub}>
            Medications added to medical records will appear here for easy tracking.
          </Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MedCard
              item={item}
              onAnimalPress={() => navigation.navigate('AnimalDetail', { animalId: item.animalId })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />
          }
          ListHeaderComponent={() => (
            <View style={styles.infoCard}>
              <Icon name="information-outline" size={16} color={COLORS.brand} />
              <Text style={styles.infoText}>
                {medications.length} active medication{medications.length !== 1 ? 's' : ''} across all animals. Tap an animal to view its full medical record.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title:    { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  countBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.attentionBg,
    alignItems: 'center', justifyContent: 'center',
  },
  countText: { fontSize: 14, fontWeight: '800', color: COLORS.attention },

  list: { padding: SPACING.md, gap: SPACING.sm },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.brandLight, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.brandMuted,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.brandDark, lineHeight: 18 },

  medCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, ...SHADOW.card,
  },
  medIconWrap: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  medInfo:     { flex: 1, gap: 3 },
  medRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medName:     { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  medDosage:   { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  medFrequency:{ fontSize: 12, color: COLORS.textSecondary },
  animalTag:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  animalTagText:{ fontSize: 11, color: COLORS.brand, fontWeight: '600' },
  endDate:     { fontSize: 10, color: COLORS.textMuted },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: SPACING.sm, paddingHorizontal: SPACING.xl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptySub:   { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default MedicationScheduleScreen;
