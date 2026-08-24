// ─── AdoptionShowcaseScreen ───────────────────────────────────────────────────
// 4th tab: Gallery of adoption-ready animals.
// Staff scrolls through this with potential adopters — like a digital brochure.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listAnimals } from '../services/animalService';

const SPECIES_ICON = {
  dog: 'dog', cat: 'cat', cow: 'cow', buffalo: 'cow',
  bird: 'bird', rabbit: 'rabbit', horse: 'horse-variant', other: 'paw',
};
const SPECIES_COLOR = {
  dog: '#F59E0B', cat: '#8B5CF6', cow: '#10B981', buffalo: '#059669',
  bird: '#3B82F6', rabbit: '#EC4899', horse: '#6366F1', other: COLORS.brand,
};

// ── Animal Card ───────────────────────────────────────────────────────────────
const AdoptionCard = ({ animal, onPress }) => {
  const iconColor = SPECIES_COLOR[animal.species] || COLORS.brand;
  const iconBg    = iconColor + '18';

  // Show published AI summary first, fall back to adoptionDescription
  const summaryText =
    (animal.aiSummaryStatus === 'published' && animal.aiAdoptionSummary)
      ? animal.aiAdoptionSummary
      : animal.adoptionDescription;

  const summarySnippet = summaryText
    ? (summaryText.length > 120 ? summaryText.slice(0, 120).trimEnd() + '…' : summaryText)
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      {/* Avatar */}
      {animal.photoUrl ? (
        <Image source={{ uri: animal.photoUrl }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatarWrap, { backgroundColor: iconBg }]}>
          <Icon name={SPECIES_ICON[animal.species] || 'paw'} size={44} color={iconColor} />
        </View>
      )}

      {/* Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{animal.name || 'Unnamed'}</Text>
            <Text style={styles.cardSpecies}>
              {animal.species.charAt(0).toUpperCase() + animal.species.slice(1)}
              {animal.breed ? ` · ${animal.breed}` : ''}
            </Text>
          </View>
          <View style={styles.cardTopRight}>
            <View style={styles.caseIdBadge}>
              <Text style={styles.caseIdText}>{animal.caseId}</Text>
            </View>
            <View style={[styles.qrBadge, { backgroundColor: iconBg }]}>
              <Icon name="qrcode" size={14} color={iconColor} />
            </View>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: animal.isVaccinated ? COLORS.healthyBg : COLORS.neutralBg }]}>
            <Icon name={animal.isVaccinated ? 'needle' : 'needle-off'} size={12}
              color={animal.isVaccinated ? COLORS.healthy : COLORS.textMuted} />
            <Text style={[styles.statText, { color: animal.isVaccinated ? COLORS.healthy : COLORS.textMuted }]}>
              {animal.isVaccinated ? 'Vaccinated' : 'Not Vaccinated'}
            </Text>
          </View>
          <View style={[styles.stat, { backgroundColor: animal.isNeutered ? COLORS.healthyBg : COLORS.neutralBg }]}>
            <Icon name={animal.isNeutered ? 'check-circle' : 'close-circle-outline'} size={12}
              color={animal.isNeutered ? COLORS.healthy : COLORS.textMuted} />
            <Text style={[styles.statText, { color: animal.isNeutered ? COLORS.healthy : COLORS.textMuted }]}>
              {animal.isNeutered ? 'Neutered' : 'Not Neutered'}
            </Text>
          </View>
          <View style={[styles.stat, {
            backgroundColor: animal.healthStatus === 'healthy' ? COLORS.healthyBg
              : animal.healthStatus === 'critical' ? COLORS.criticalBg : COLORS.brandLight,
          }]}>
            <Icon name="heart-pulse" size={12}
              color={animal.healthStatus === 'healthy' ? COLORS.healthy
                : animal.healthStatus === 'critical' ? COLORS.critical : COLORS.brand} />
            <Text style={[styles.statText, {
              color: animal.healthStatus === 'healthy' ? COLORS.healthy
                : animal.healthStatus === 'critical' ? COLORS.critical : COLORS.brand,
            }]}>
              {(animal.healthStatus || 'stable').replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* AI Adoption Summary snippet */}
        {summarySnippet ? (
          <View style={styles.summarySnippetRow}>
            {animal.aiSummaryStatus === 'published' && (
              <View style={styles.aiPill}>
                <Icon name="creation" size={10} color="#7C3AED" />
                <Text style={styles.aiPillText}>AI</Text>
              </View>
            )}
            <Text style={styles.summarySnippet} numberOfLines={3}>{summarySnippet}</Text>
          </View>
        ) : null}

        {/* View profile CTA */}
        <View style={[styles.viewBtn, { borderColor: iconColor + '50', backgroundColor: iconBg }]}>
          <Text style={[styles.viewBtnText, { color: iconColor }]}>View Full Profile</Text>
          <Icon name="arrow-right" size={14} color={iconColor} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const AdoptionShowcaseScreen = ({ navigation }) => {
  const [animals, setAnimals]       = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const all = await listAnimals();
      setAnimals(all.filter(a => a.isAdoptionReady));
    } catch (e) { console.warn('AdoptionShowcase error:', e); }
    finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={animals}
        keyExtractor={a => a.id}
        renderItem={({ item }) => (
          <AdoptionCard
            animal={item}
            onPress={() => navigation.navigate('AnimalAdoptionProfile', { animalId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.brand} />
        }
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Adoption</Text>
              <Text style={styles.subtitle}>
                {animals.length} animal{animals.length !== 1 ? 's' : ''} ready for a new home
              </Text>
            </View>
            <View style={styles.heartWrap}>
              <Icon name="heart-circle" size={36} color={COLORS.brand} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Icon name="heart-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No animals ready yet</Text>
            <Text style={styles.emptySub}>
              Open an animal's profile → Adoption tab → toggle "Ready for Adoption" to list them here.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  list:   { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.md, marginBottom: SPACING.md },
  title:  { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  heartWrap: {},

  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.md, ...SHADOW.card },
  avatarWrap: {
    height: 180, width: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: {
    height: 180, width: '100%', backgroundColor: COLORS.surface,
  },
  cardBody: { padding: SPACING.md, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  cardName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  cardSpecies: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  caseIdBadge: { backgroundColor: COLORS.borderLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  caseIdText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },

  statsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  statText: { fontSize: 11, fontWeight: '600' },

  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrBadge: { width: 28, height: 28, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },

  summarySnippetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  aiPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.full, marginTop: 1, flexShrink: 0 },
  aiPillText: { fontSize: 9, fontWeight: '800', color: '#7C3AED' },
  summarySnippet: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17, flex: 1 },

  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.lg, borderWidth: 1.5 },
  viewBtnText: { fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl, gap: SPACING.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default AdoptionShowcaseScreen;
