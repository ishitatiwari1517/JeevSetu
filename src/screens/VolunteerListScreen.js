// ─── VolunteerListScreen ──────────────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { listVolunteers } from '../services/volunteerService';
import { getOrganization } from '../services/orgService';

const SKILL_LABELS = {
  animal_handling: 'Animal Handling',
  veterinary_assist: 'Vet Assist',
  dog_training: 'Training',
  photography: 'Photography',
  driving: 'Driving',
  first_aid: 'First Aid',
  fundraising: 'Fundraising',
  foster_care: 'Foster Care',
  cattle_handling: 'Cattle',
  admin: 'Admin',
  social_media: 'Social Media',
};

const VolunteerCard = ({ vol, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
    <View style={[styles.avatar, { backgroundColor: vol.status === 'active' ? COLORS.brandLight : COLORS.neutralBg }]}>
      <Text style={[styles.avatarText, { color: vol.status === 'active' ? COLORS.brand : COLORS.neutral }]}>
        {vol.name.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={styles.info}>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{vol.name}</Text>
        {vol.status !== 'active' && (
          <View style={styles.inactivePill}>
            <Text style={styles.inactivePillText}>{vol.status}</Text>
          </View>
        )}
      </View>
      <Text style={styles.phone}>{vol.phone}</Text>
      <View style={styles.skillRow}>
        {vol.canDoRescue && <View style={styles.tag}><Text style={styles.tagText}>Rescue</Text></View>}
        {vol.canFoster && <View style={styles.tag}><Text style={styles.tagText}>Foster</Text></View>}
        {vol.canDrive && <View style={styles.tag}><Text style={styles.tagText}>Driver</Text></View>}
        {(vol.skills || []).slice(0, 2).map(s => (
          <View key={s} style={styles.tag}>
            <Text style={styles.tagText}>{SKILL_LABELS[s] || s}</Text>
          </View>
        ))}
      </View>
    </View>
    <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const VolunteerListScreen = ({ navigation }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [search, setSearch]         = useState('');
  const [orgId, setOrgId]           = useState('default');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const org = await getOrganization();
      const oid = org?.id || 'default';
      setOrgId(oid);
      setVolunteers(await listVolunteers(oid));
    } catch (e) {
      console.warn('VolunteerList error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const displayed = volunteers.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || v.phone.includes(q) || v.email?.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={displayed}
        keyExtractor={v => v.id}
        renderItem={({ item }) => (
          <VolunteerCard
            vol={item}
            onPress={() => navigation.navigate('VolunteerDetail', { volunteerId: item.id })}
          />
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
                <Text style={styles.title}>Volunteers</Text>
                <Text style={styles.subtitle}>{volunteers.length} registered</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddVolunteer')}>
                <Icon name="plus" size={18} color={COLORS.textOnBrand} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchBar}>
              <Icon name="magnify" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone…"
                placeholderTextColor={COLORS.placeholder}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Icon name="account-group-outline" size={52} color={COLORS.border} />
            <Text style={styles.emptyTitle}>{search ? 'No match' : 'No volunteers yet'}</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search.' : 'Tap "Add" to register your first volunteer.'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.background },
  list:  { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingTop: SPACING.md, marginBottom: SPACING.md },
  title:  { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.brand, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.lg },
  addBtnText: { color: COLORS.textOnBrand, fontWeight: '700', fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 10, gap: SPACING.sm, marginBottom: SPACING.sm, ...SHADOW.card },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, padding: 0 },
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOW.card },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  info:  { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name:  { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  phone: { fontSize: 12, color: COLORS.textSecondary },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  tag: { backgroundColor: COLORS.brandLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  tagText: { fontSize: 9, fontWeight: '600', color: COLORS.brand },
  inactivePill: { backgroundColor: COLORS.neutralBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  inactivePillText: { fontSize: 9, fontWeight: '700', color: COLORS.neutral },
  empty: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl },
});

export default VolunteerListScreen;
