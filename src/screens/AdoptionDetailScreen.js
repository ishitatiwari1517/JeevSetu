// ─── AdoptionDetailScreen ─────────────────────────────────────────────────────
// View and manage a single adoption application — move through the workflow.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { getAdoptionApplication, updateAdoptionApplication } from '../services/adoptionService';
import { getOrganization } from '../services/orgService';

// ── Workflow definition ────────────────────────────────────────────────────────
const WORKFLOW = [
  { key: 'submitted',    label: 'Submitted',    icon: 'email-outline',       color: COLORS.brand },
  { key: 'under_review', label: 'Under Review', icon: 'magnify',             color: COLORS.attention },
  { key: 'approved',     label: 'Approved',     icon: 'check-circle-outline', color: COLORS.healthy },
  { key: 'home_visit',   label: 'Home Visit',   icon: 'home-search-outline', color: '#7C3AED' },
  { key: 'completed',    label: 'Adopted! 🎉',  icon: 'heart-circle',        color: COLORS.healthy },
];

const NEXT_STATUS = {
  submitted:    'under_review',
  under_review: 'approved',
  approved:     'home_visit',
  home_visit:   'completed',
  completed:    null,
  rejected:     null,
};

const NEXT_ACTION_LABEL = {
  submitted:    'Start Review',
  under_review: 'Approve Application',
  approved:     'Schedule Home Visit',
  home_visit:   'Mark as Adopted ✓',
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Info Row ────────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  ) : null;

// ── Workflow step ───────────────────────────────────────────────────────────────
const WorkflowStep = ({ step, status }) => {
  const currentIdx = WORKFLOW.findIndex(s => s.key === status);
  const stepIdx    = WORKFLOW.findIndex(s => s.key === step.key);
  const isCompleted = stepIdx < currentIdx;
  const isActive    = step.key === status;
  const isFuture    = stepIdx > currentIdx;

  return (
    <View style={styles.wfStep}>
      <View style={[
        styles.wfDot,
        isCompleted && { backgroundColor: COLORS.healthy },
        isActive    && { backgroundColor: step.color, borderWidth: 3, borderColor: step.color + '40' },
        isFuture    && { backgroundColor: COLORS.border },
      ]}>
        <Icon
          name={isCompleted ? 'check' : step.icon}
          size={14}
          color={isFuture ? COLORS.textMuted : '#fff'}
        />
      </View>
      <Text style={[styles.wfLabel, isActive && { color: step.color, fontWeight: '700' }, isFuture && { color: COLORS.textMuted }]}>
        {step.label}
      </Text>
    </View>
  );
};

// ── Main Screen ─────────────────────────────────────────────────────────────────
const AdoptionDetailScreen = ({ route, navigation }) => {
  const { applicationId } = route.params;
  const [app, setApp]         = useState(null);
  const [orgId, setOrgId]     = useState('default');
  const [refreshing, setRefreshing] = useState(false);
  const [advancing, setAdvancing]   = useState(false);

  const loadData = useCallback(async () => {
    try {
      const org = await getOrganization();
      const oid = org?.id || 'default';
      setOrgId(oid);
      setApp(await getAdoptionApplication(oid, applicationId));
    } catch (e) { console.warn('AdoptionDetail error:', e); }
    finally { setRefreshing(false); }
  }, [applicationId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleAdvance = async () => {
    if (!app) return;
    const next = NEXT_STATUS[app.status];
    if (!next) return;
    const label = NEXT_ACTION_LABEL[app.status];

    Alert.alert(label, `Move this application to "${WORKFLOW.find(s => s.key === next)?.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setAdvancing(true);
          try {
            const updated = await updateAdoptionApplication(orgId, app.id, {
              status: next,
              reviewedAt: next === 'under_review' ? new Date().toISOString() : app.reviewedAt,
              approvedAt: next === 'approved'     ? new Date().toISOString() : app.approvedAt,
              completedAt: next === 'completed'   ? new Date().toISOString() : app.completedAt,
            });
            setApp(updated);
          } catch (e) { Alert.alert('Error', 'Could not update application.'); }
          finally { setAdvancing(false); }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Application', 'Are you sure you want to reject this application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = await updateAdoptionApplication(orgId, app.id, { status: 'rejected' });
            setApp(updated);
          } catch (e) { Alert.alert('Error', 'Could not reject application.'); }
        },
      },
    ]);
  };

  if (!app) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.textSecondary }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const canAdvance  = NEXT_STATUS[app.status] !== null && app.status !== 'rejected';
  const canReject   = app.status !== 'completed' && app.status !== 'rejected';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Adoption Application</Text>
          <Text style={styles.headerSub}>{app.applicantName}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.brand} />}
      >
        {/* Workflow progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>WORKFLOW PROGRESS</Text>
          <View style={styles.wfRow}>
            {WORKFLOW.map((step, i) => (
              <React.Fragment key={step.key}>
                <WorkflowStep step={step} status={app.status} />
                {i < WORKFLOW.length - 1 && <View style={[styles.wfLine, WORKFLOW.findIndex(s => s.key === app.status) > i && { backgroundColor: COLORS.healthy }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Applicant info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>APPLICANT</Text>
          <InfoRow label="Name"    value={app.applicantName} />
          <InfoRow label="Phone"   value={app.applicantPhone} />
          <InfoRow label="Email"   value={app.applicantEmail} />
          <InfoRow label="Address" value={app.applicantAddress} />
          <InfoRow label="Applied" value={fmtDate(app.submittedAt)} />
        </View>

        {/* Animal info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ANIMAL</Text>
          <InfoRow label="Animal"   value={app.animalName || 'Unknown'} />
          <InfoRow label="Case ID"  value={app.animalCaseId} />
          <InfoRow label="Species"  value={app.animalSpecies} />
        </View>

        {/* Application details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>APPLICATION DETAILS</Text>
          <InfoRow label="Home type"  value={app.homeType} />
          <InfoRow label="Has children"  value={app.hasChildren ? 'Yes' : 'No'} />
          <InfoRow label="Has other pets" value={app.hasOtherPets ? 'Yes' : 'No'} />
          <InfoRow label="Other pets"  value={app.otherPetsDescription} />
          <InfoRow label="Experience"  value={app.previousPetExperience} />
          <InfoRow label="Reason"      value={app.reasonForAdoption} />
        </View>

        {/* Timeline */}
        {(app.reviewedAt || app.approvedAt || app.completedAt) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>TIMELINE</Text>
            <InfoRow label="Submitted"  value={fmtDate(app.submittedAt)} />
            {app.reviewedAt  && <InfoRow label="Reviewed"  value={fmtDate(app.reviewedAt)} />}
            {app.approvedAt  && <InfoRow label="Approved"  value={fmtDate(app.approvedAt)} />}
            {app.completedAt && <InfoRow label="Adopted"   value={fmtDate(app.completedAt)} />}
          </View>
        )}

        {/* Staff notes */}
        {app.staffNotes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>STAFF NOTES</Text>
            <Text style={styles.notesText}>{app.staffNotes}</Text>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Action buttons */}
      {(canAdvance || canReject) && (
        <View style={styles.actionBar}>
          {canReject && (
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
              <Icon name="close-circle-outline" size={18} color={COLORS.critical} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          )}
          {canAdvance && (
            <TouchableOpacity
              style={[styles.advanceBtn, advancing && { opacity: 0.5 }]}
              onPress={handleAdvance}
              disabled={advancing}
            >
              <Icon name="arrow-right-circle" size={18} color={COLORS.textOnBrand} />
              <Text style={styles.advanceBtnText}>{NEXT_ACTION_LABEL[app.status] || 'Next Step'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md },
  header:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn:    { padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  headerSub:   { fontSize: 12, color: COLORS.textSecondary },
  card:      { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 2, ...SHADOW.card },
  cardTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.6, marginBottom: 6 },
  infoRow:   { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, width: 130 },
  infoValue: { fontSize: 13, color: COLORS.textPrimary, flex: 1 },
  notesText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  wfRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  wfStep:  { alignItems: 'center', flex: 1 },
  wfDot:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  wfLine:  { height: 2, flex: 0.5, backgroundColor: COLORS.border, marginBottom: 20 },
  wfLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  actionBar: { flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.critical, paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.lg },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.critical },
  advanceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.brand, paddingVertical: 14, borderRadius: RADIUS.lg },
  advanceBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textOnBrand },
});

export default AdoptionDetailScreen;
