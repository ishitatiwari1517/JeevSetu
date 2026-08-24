// ─── VolunteerDetailScreen ────────────────────────────────────────────────────
// Full profile of a single volunteer — info, capabilities, assigned tasks.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { getVolunteer, updateVolunteer, listTasks } from '../services/volunteerService';
import { getOrganization } from '../services/orgService';

const SKILL_LABELS = {
  animal_handling: 'Animal Handling', veterinary_assist: 'Vet Assist',
  dog_training: 'Dog Training', first_aid: 'First Aid', driving: 'Driving',
  photography: 'Photography', social_media: 'Social Media', fundraising: 'Fundraising',
  admin: 'Admin', foster_care: 'Foster Care', cattle_handling: 'Cattle Handling',
};

const DAY_LABELS = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' };

const TASK_PRIORITY_COLOR = {
  low: COLORS.neutral, normal: COLORS.brand,
  high: COLORS.attention, urgent: COLORS.critical,
};

const TASK_STATUS_BG = {
  pending: COLORS.neutralBg, in_progress: COLORS.brandLight,
  done: COLORS.healthyBg, missed: COLORS.criticalBg, skipped: COLORS.neutralBg,
};

// ── Capability Row ─────────────────────────────────────────────────────────────
const CapRow = ({ icon, label, value }) => (
  value ? (
    <View style={styles.capRow}>
      <Icon name={icon} size={16} color={COLORS.brand} />
      <Text style={styles.capLabel}>{label}</Text>
    </View>
  ) : null
);

// ── Info Row ───────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => value ? (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
) : null;

// ── Task Card ──────────────────────────────────────────────────────────────────
const TaskCard = ({ task }) => (
  <View style={[styles.taskCard, { backgroundColor: TASK_STATUS_BG[task.status] || COLORS.surface }]}>
    <View style={[styles.taskPriorityDot, { backgroundColor: TASK_PRIORITY_COLOR[task.priority] || COLORS.neutral }]} />
    <View style={styles.taskInfo}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      {task.animalName && <Text style={styles.taskAnimal}>{task.animalName} · {task.animalCaseId}</Text>}
      <Text style={styles.taskTime}>
        {new Date(task.scheduledFor).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
    <View style={styles.taskStatusBadge}>
      <Text style={styles.taskStatusText}>{task.status.replace('_', ' ')}</Text>
    </View>
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const TABS = ['Profile', 'Tasks'];

const VolunteerDetailScreen = ({ route, navigation }) => {
  const { volunteerId } = route.params;
  const [volunteer, setVolunteer] = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [activeTab, setTab]       = useState('Profile');
  const [orgId, setOrgId]         = useState('default');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const org = await getOrganization();
      const oid = org?.id || 'default';
      setOrgId(oid);
      const [vol, volTasks] = await Promise.all([
        getVolunteer(oid, volunteerId),
        listTasks(oid, volunteerId),
      ]);
      setVolunteer(vol);
      setTasks(volTasks);
    } catch (e) { console.warn('VolunteerDetail error:', e); }
    finally { setRefreshing(false); }
  }, [volunteerId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const toggleStatus = async () => {
    if (!volunteer) return;
    const newStatus = volunteer.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await updateVolunteer(orgId, volunteer.id, { status: newStatus });
      setVolunteer(updated);
    } catch (e) { Alert.alert('Error', 'Could not update status.'); }
  };

  if (!volunteer) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'done');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.heroInfo}>
          <View style={[styles.avatar, { backgroundColor: volunteer.status === 'active' ? COLORS.brandLight : COLORS.neutralBg }]}>
            <Text style={[styles.avatarText, { color: volunteer.status === 'active' ? COLORS.brand : COLORS.neutral }]}>
              {volunteer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{volunteer.name}</Text>
            <Text style={styles.heroPhone}>{volunteer.phone}</Text>
            <View style={styles.heroCapRow}>
              {volunteer.canDoRescue && <View style={styles.heroTag}><Text style={styles.heroTagText}>Rescue</Text></View>}
              {volunteer.canFoster && <View style={styles.heroTag}><Text style={styles.heroTagText}>Foster</Text></View>}
              {volunteer.canDrive && <View style={styles.heroTag}><Text style={styles.heroTagText}>Driver</Text></View>}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.statusToggle, { backgroundColor: volunteer.status === 'active' ? COLORS.healthyBg : COLORS.neutralBg }]}
          onPress={toggleStatus}
        >
          <Text style={[styles.statusToggleText, { color: volunteer.status === 'active' ? COLORS.healthy : COLORS.neutral }]}>
            {volunteer.status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            {t === 'Tasks' && pendingTasks.length > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pendingTasks.length}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.brand} />}
      >
        {activeTab === 'Profile' && (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{volunteer.totalShiftsCompleted}</Text>
                <Text style={styles.statLbl}>Shifts Done</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{Math.round(volunteer.totalHoursLogged)}</Text>
                <Text style={styles.statLbl}>Hours</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{volunteer.totalShiftsMissed}</Text>
                <Text style={styles.statLbl}>Missed</Text>
              </View>
            </View>

            {/* Contact */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>CONTACT</Text>
              <InfoRow label="Phone"   value={volunteer.phone} />
              <InfoRow label="Email"   value={volunteer.email} />
              <InfoRow label="Address" value={volunteer.address} />
              <InfoRow label="Emergency Contact" value={volunteer.emergencyContact} />
              <InfoRow label="Emergency Phone"   value={volunteer.emergencyPhone} />
            </View>

            {/* Availability */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>AVAILABILITY</Text>
              <View style={styles.dayRow}>
                {(volunteer.availableDays || []).map(d => (
                  <View key={d} style={styles.dayChip}>
                    <Text style={styles.dayChipText}>{DAY_LABELS[d] || d}</Text>
                  </View>
                ))}
                {(!volunteer.availableDays || volunteer.availableDays.length === 0) && (
                  <Text style={styles.emptyText}>Not specified</Text>
                )}
              </View>
              <InfoRow label="Preferred Shift" value={volunteer.preferredShift} />
            </View>

            {/* Capabilities */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>CAPABILITIES</Text>
              <CapRow icon="ambulance"       label="Can do animal rescue"     value={volunteer.canDoRescue} />
              <CapRow icon="stethoscope"     label="Can assist vet / medical" value={volunteer.canDoMedicalAssist} />
              <CapRow icon="car"             label="Can drive"                value={volunteer.canDrive} />
              <CapRow icon="home-heart"      label="Can foster animals"       value={volunteer.canFoster} />
              <CapRow icon="truck"           label="Has vehicle available"    value={volunteer.vehicleAvailable} />
              {!volunteer.canDoRescue && !volunteer.canDoMedicalAssist && !volunteer.canDrive && !volunteer.canFoster && (
                <Text style={styles.emptyText}>No capabilities marked</Text>
              )}
            </View>

            {/* Skills */}
            {volunteer.skills?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>SKILLS</Text>
                <View style={styles.skillGrid}>
                  {volunteer.skills.map(s => (
                    <View key={s} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{SKILL_LABELS[s] || s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {volunteer.notes && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>NOTES</Text>
                <Text style={styles.notesText}>{volunteer.notes}</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Tasks' && (
          <>
            {tasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard-check-outline" size={44} color={COLORS.border} />
                <Text style={styles.emptyTitle}>No tasks assigned</Text>
                <Text style={styles.emptySub}>Tasks will appear here once assigned via the scheduling system.</Text>
              </View>
            ) : (
              <>
                {pendingTasks.length > 0 && (
                  <>
                    <Text style={styles.taskSection}>Pending ({pendingTasks.length})</Text>
                    {pendingTasks.map(t => <TaskCard key={t.id} task={t} />)}
                  </>
                )}
                {completedTasks.length > 0 && (
                  <>
                    <Text style={styles.taskSection}>Completed ({completedTasks.length})</Text>
                    {completedTasks.map(t => <TaskCard key={t.id} task={t} />)}
                  </>
                )}
              </>
            )}
          </>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md },
  header:  { backgroundColor: COLORS.surface, padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { marginBottom: SPACING.sm },
  heroInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  avatar:  { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  heroText: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  heroPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  heroCapRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  heroTag: { backgroundColor: COLORS.brandLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  heroTagText: { fontSize: 10, fontWeight: '600', color: COLORS.brand },
  statusToggle: { position: 'absolute', top: SPACING.md, right: SPACING.md, paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.full },
  statusToggleText: { fontSize: 12, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.brand },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.brand },
  tabBadge: { backgroundColor: COLORS.attention, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.card },
  statBox:  { flex: 1, alignItems: 'center' },
  statVal:  { fontSize: 24, fontWeight: '800', color: COLORS.brand },
  statLbl:  { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 4, ...SHADOW.card },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 4 },
  infoRow:   { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, width: 130 },
  infoValue: { fontSize: 13, color: COLORS.textPrimary, flex: 1 },
  capRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  capLabel:  { fontSize: 13, color: COLORS.textPrimary },
  dayRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  dayChip:   { backgroundColor: COLORS.brandLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  dayChipText: { fontSize: 12, fontWeight: '600', color: COLORS.brand },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: { backgroundColor: COLORS.neutralBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  skillChipText: { fontSize: 11, color: COLORS.neutral, fontWeight: '600' },
  notesText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  taskSection: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  taskCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  taskPriorityDot: { width: 8, height: 8, borderRadius: 4 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  taskAnimal: { fontSize: 11, color: COLORS.brand, marginTop: 2 },
  taskTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  taskStatusBadge: { backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  taskStatusText: { fontSize: 9, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  emptySub:   { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl },
});

export default VolunteerDetailScreen;
