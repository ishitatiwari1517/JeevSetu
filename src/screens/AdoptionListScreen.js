// ─── AdoptionListScreen ───────────────────────────────────────────────────────
// Overview of all adoption applications with status filters.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listAdoptionApplications } from '../services/adoptionService';
import { getOrganization } from '../services/orgService';
import StatusChip from '../components/StatusChip';

const STATUS_FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'submitted',    label: '📬 New' },
  { key: 'under_review', label: '🔍 Reviewing' },
  { key: 'approved',     label: '✅ Approved' },
  { key: 'completed',    label: '🎉 Adopted' },
  { key: 'rejected',     label: '❌ Rejected' },
];

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const AppCard = ({ app, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.cardLeft}>
      <View style={[styles.avatar, { backgroundColor: '#EDE9FE' }]}>
        <Icon name="heart-circle" size={22} color="#7C3AED" />
      </View>
    </View>
    <View style={styles.cardInfo}>
      <Text style={styles.applicantName}>{app.applicantName}</Text>
      <Text style={styles.animalName}>{app.animalName || 'Animal'} · {app.animalCaseId}</Text>
      <Text style={styles.dateText}>Applied {fmtDate(app.submittedAt)}</Text>
      <View style={{ marginTop: 4 }}>
        <StatusChip variant={app.status} size="sm" />
      </View>
    </View>
    <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const AdoptionListScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [activeFilter, setFilter]       = useState('all');
  const [refreshing, setRefreshing]     = useState(false);
  const [orgId, setOrgId]               = useState('default');

  const loadData = useCallback(async () => {
    try {
      const org = await getOrganization();
      const oid = org?.id || 'default';
      setOrgId(oid);
      setApplications(await listAdoptionApplications(oid));
    } catch (e) { console.warn('AdoptionList error:', e); }
    finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const displayed = activeFilter === 'all'
    ? applications
    : applications.filter(a => a.status === activeFilter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={displayed}
        keyExtractor={a => a.id}
        renderItem={({ item }) => (
          <AppCard app={item} onPress={() => navigation.navigate('AdoptionDetail', { applicationId: item.id })} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.brand} />}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Adoption Applications</Text>
                <Text style={styles.subtitle}>{applications.length} total</Text>
              </View>
            </View>
            <FlatList
              data={STATUS_FILTERS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={f => f.key}
              contentContainerStyle={{ gap: SPACING.sm, paddingBottom: SPACING.sm }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
                  onPress={() => setFilter(item.key)}
                >
                  <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Icon name="heart-outline" size={52} color={COLORS.border} />
            <Text style={styles.emptyTitle}>{activeFilter !== 'all' ? 'No applications here' : 'No applications yet'}</Text>
            <Text style={styles.emptySub}>Applications will appear here once animals are marked adoption-ready and people apply.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.md, marginBottom: SPACING.sm },
  title:  { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.textOnBrand },
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card },
  cardLeft: {},
  avatar: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  applicantName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  animalName:    { fontSize: 12, color: COLORS.brand, fontWeight: '500' },
  dateText:      { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl, lineHeight: 20 },
});

export default AdoptionListScreen;
