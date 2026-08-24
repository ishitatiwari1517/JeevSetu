// ─── AnimalDetailScreen ───────────────────────────────────────────────────────
// The full digital identity of a single animal — tabbed profile with all records.

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { getAnimal, updateAnimal } from '../services/animalService';
import { listMedicalRecords } from '../services/medicalRecordService';
import { listAnimalEvents } from '../services/animalEventService';
import { getOrganization } from '../services/orgService';
import { listScansByAnimal } from '../services/scanHistoryService';
import { STATUS_BANNER } from '../services/scanResult';
import StatusChip from '../components/StatusChip';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SPECIES_ICON = {
  dog: 'dog', cat: 'cat', cow: 'cow', buffalo: 'cow',
  bird: 'bird', rabbit: 'rabbit', horse: 'horse-variant', other: 'paw',
};

const EVENT_ICON = {
  intake:           { icon: 'home-plus',        color: COLORS.brand },
  status_change:    { icon: 'swap-horizontal',   color: COLORS.attention },
  medical:          { icon: 'stethoscope',       color: '#7C3AED' },
  vaccination:      { icon: 'needle',            color: COLORS.healthy },
  ai_scan:          { icon: 'brain',             color: '#7C3AED' },
  photo_added:      { icon: 'camera',            color: COLORS.brand },
  note_updated:     { icon: 'note-edit',         color: COLORS.neutral },
  foster_assigned:  { icon: 'home-heart',        color: '#5B21B6' },
  adoption_completed:{ icon: 'heart-circle',     color: COLORS.healthy },
  weight_logged:    { icon: 'scale',             color: COLORS.brand },
  default:          { icon: 'circle-small',      color: COLORS.neutral },
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Sub-components ────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, icon }) => (
  value ? (
    <View style={styles.infoRow}>
      {icon && <Icon name={icon} size={15} color={COLORS.textMuted} style={{ marginTop: 1 }} />}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  ) : null
);

const SectionCard = ({ title, children, action, onAction }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionCardHeader}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}
    </View>
    {children}
  </View>
);

const MedRecordRow = ({ record }) => (
  <View style={styles.medRow}>
    <View style={[styles.medIcon, { backgroundColor: COLORS.brandLight }]}>
      <Icon name="stethoscope" size={14} color={COLORS.brand} />
    </View>
    <View style={styles.medInfo}>
      <Text style={styles.medTitle}>{record.title}</Text>
      <Text style={styles.medSub}>{fmtDate(record.recordedAt)} · {record.recordedBy}</Text>
      {record.diagnosis && <Text style={styles.medDiagnosis}>{record.diagnosis}</Text>}
    </View>
    {record.aiGenerated && (
      <View style={styles.aiTag}><Text style={styles.aiTagText}>AI</Text></View>
    )}
  </View>
);

const EventRow = ({ event }) => {
  const cfg = EVENT_ICON[event.eventType] || EVENT_ICON.default;
  return (
    <View style={styles.eventRow}>
      <View style={[styles.eventIconWrap, { backgroundColor: cfg.color + '15' }]}>
        <Icon name={cfg.icon} size={16} color={cfg.color} />
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {event.description && <Text style={styles.eventDesc}>{event.description}</Text>}
        <Text style={styles.eventMeta}>{fmtDateTime(event.occurredAt)} · {event.performedBy}</Text>
      </View>
    </View>
  );
};

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Medical', 'Scans', 'Timeline', 'Adoption'];

const TabBar = ({ active, onSelect }) => (
  <View style={styles.tabBar}>
    {TABS.map(t => (
      <TouchableOpacity
        key={t}
        style={[styles.tab, active === t && styles.tabActive]}
        onPress={() => onSelect(t)}
      >
        <Text style={[styles.tabText, active === t && styles.tabTextActive]}>{t}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Overview Tab ──────────────────────────────────────────────────────────────
const OverviewTab = ({ animal }) => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
    <SectionCard title="Identity">
      <InfoRow label="Case ID"      value={animal.caseId} />
      <InfoRow label="Species"      value={animal.species?.charAt(0).toUpperCase() + animal.species?.slice(1)} />
      <InfoRow label="Breed"        value={animal.breed} />
      <InfoRow label="Gender"       value={animal.gender?.charAt(0).toUpperCase() + animal.gender?.slice(1)} />
      <InfoRow label="Est. Age"     value={animal.estimatedAge} />
      <InfoRow label="Weight"       value={animal.weightKg ? `${animal.weightKg} kg` : undefined} />
      <InfoRow label="Markings"     value={animal.colorMarkings} />
      <InfoRow label="Microchip"    value={animal.microchipId} />
    </SectionCard>

    <SectionCard title="Rescue & Location">
      <InfoRow label="Intake Date"  value={fmtDate(animal.intakeDate)} />
      <InfoRow label="Source"       value={animal.intakeSource?.replace(/_/g, ' ')} />
      <InfoRow label="Location"     value={animal.intakeLocation} />
      <InfoRow label="Rescued By"   value={animal.rescuedBy} />
      <InfoRow label="Kennel"       value={animal.kennelNumber} />
      <InfoRow label="Condition at Intake" value={animal.intakeCondition} />
      <InfoRow label="Intake Notes" value={animal.intakeNotes} />
    </SectionCard>

    <SectionCard title="Health Status">
      <InfoRow label="Overall"      value={animal.healthStatus?.replace(/_/g, ' ')} />
      <InfoRow label="Neutered"     value={animal.isNeutered ? 'Yes' : 'No'} />
      <InfoRow label="Vaccinated"   value={animal.isVaccinated ? 'Yes' : 'No'} />
    </SectionCard>

    <SectionCard title="Behaviour & Care">
      <InfoRow label="Behaviour"          value={animal.behaviourNotes} />
      <InfoRow label="Diet"               value={animal.dietaryRequirements} />
      <InfoRow label="Special Needs"      value={animal.specialNeeds} />
      <InfoRow label="Good with kids"     value={animal.isGoodWithKids === true ? 'Yes' : animal.isGoodWithKids === false ? 'No' : undefined} />
      <InfoRow label="Good with dogs"     value={animal.isGoodWithDogs === true ? 'Yes' : animal.isGoodWithDogs === false ? 'No' : undefined} />
      <InfoRow label="Good with cats"     value={animal.isGoodWithCats === true ? 'Yes' : animal.isGoodWithCats === false ? 'No' : undefined} />
    </SectionCard>
  </ScrollView>
);

// ── Medical Tab ───────────────────────────────────────────────────────────────
const MedicalTab = ({ records, onAddRecord }) => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
    <TouchableOpacity style={styles.addBtn} onPress={onAddRecord}>
      <Icon name="plus" size={16} color={COLORS.brand} />
      <Text style={styles.addBtnText}>Add Medical Record</Text>
    </TouchableOpacity>

    {records.length === 0 ? (
      <View style={styles.tabEmpty}>
        <Icon name="clipboard-text-outline" size={40} color={COLORS.border} />
        <Text style={styles.tabEmptyText}>No medical records yet</Text>
        <Text style={styles.tabEmptySubText}>Add the first checkup, vaccination, or treatment record.</Text>
      </View>
    ) : (
      <SectionCard title={`Records (${records.length})`}>
        {records.map((r, i) => (
          <View key={r.id}>
            <MedRecordRow record={r} />
            {i < records.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </SectionCard>
    )}
  </ScrollView>
);

// ── Timeline Tab ──────────────────────────────────────────────────────────────
const TimelineTab = ({ events }) => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
    {events.length === 0 ? (
      <View style={styles.tabEmpty}>
        <Icon name="timeline-outline" size={40} color={COLORS.border} />
        <Text style={styles.tabEmptyText}>No events yet</Text>
      </View>
    ) : (
      <View style={styles.timeline}>
        {events.map((e, i) => (
          <View key={e.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <EventRow event={e} />
            </View>
            {i < events.length - 1 && <View style={styles.timelineLine} />}
          </View>
        ))}
      </View>
    )}
  </ScrollView>
);

// ── Scans Tab ─────────────────────────────────────────────────────────────────
const ScanHistoryCard = ({ scan, onPress }) => {
  const banner = STATUS_BANNER[scan.result?.overallStatus] ?? STATUS_BANNER.NEEDS_ATTENTION;
  const date = scan.createdAt
    ? new Date(scan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const time = scan.createdAt
    ? new Date(scan.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';
  return (
    <TouchableOpacity style={styles.scanCard} onPress={onPress} activeOpacity={0.8}>
      {scan.heroUri ? (
        <Image source={{ uri: scan.heroUri }} style={styles.scanThumb} />
      ) : (
        <View style={[styles.scanThumb, styles.scanThumbPlaceholder]}>
          <Icon name="brain" size={20} color={COLORS.brand} />
        </View>
      )}
      <View style={styles.scanCardInfo}>
        <View style={[styles.scanStatusPill, { backgroundColor: banner.tone }]}>
          <Text style={styles.scanStatusText}>{banner.label}</Text>
        </View>
        <Text style={styles.scanDate}>{date} · {time}</Text>
        <Text style={styles.scanMeta}>{scan.imageCount} image{scan.imageCount === 1 ? '' : 's'} analyzed</Text>
      </View>
      <Icon name="chevron-right" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

const ScansTab = ({ scans, onScanPress, onRunScan }) => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
    <TouchableOpacity style={styles.addBtn} onPress={onRunScan}>
      <Icon name="camera" size={16} color={COLORS.brand} />
      <Text style={styles.addBtnText}>Run New AI Scan</Text>
    </TouchableOpacity>

    {scans.length === 0 ? (
      <View style={styles.tabEmpty}>
        <Icon name="brain" size={40} color={COLORS.border} />
        <Text style={styles.tabEmptyText}>No scans yet</Text>
        <Text style={styles.tabEmptySubText}>Run an AI health scan to see results here.</Text>
      </View>
    ) : (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>Scan History ({scans.length})</Text>
        {scans.map((s, i) => (
          <View key={s.id}>
            <ScanHistoryCard scan={s} onPress={() => onScanPress(s)} />
            {i < scans.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>
    )}
  </ScrollView>
);

// ── Adoption Tab ──────────────────────────────────────────────────────────────
const AdoptionTab = ({ animal, onToggleReady, onViewProfile }) => (
  <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
    <SectionCard title="Adoption Readiness">
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Ready for Adoption</Text>
          <Text style={styles.toggleSub}>Mark this animal as available for adoption applications</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, animal.isAdoptionReady && styles.toggleOn]}
          onPress={onToggleReady}
        >
          <View style={[styles.toggleThumb, animal.isAdoptionReady && styles.toggleThumbOn]} />
        </TouchableOpacity>
      </View>
      {animal.adoptionDescription && (
        <View style={{ marginTop: SPACING.md }}>
          <Text style={styles.fieldLabel}>Adoption Description</Text>
          <Text style={styles.adoptionDesc}>{animal.adoptionDescription}</Text>
        </View>
      )}

      {/* AI Summary status indicator */}
      {animal.aiSummaryStatus === 'published' && (
        <View style={styles.aiSummaryIndicator}>
          <Icon name="creation" size={14} color="#7C3AED" />
          <Text style={styles.aiSummaryIndicatorText}>AI Adoption Summary published ✔</Text>
        </View>
      )}
    </SectionCard>

    {/* QR & Profile CTA */}
    <TouchableOpacity style={styles.qrProfileBtn} onPress={onViewProfile}>
      <View style={styles.qrProfileBtnLeft}>
        <View style={styles.qrProfileIcon}>
          <Icon name="qrcode" size={22} color={COLORS.brand} />
        </View>
        <View>
          <Text style={styles.qrProfileBtnTitle}>View QR & Full Profile</Text>
          <Text style={styles.qrProfileBtnSub}>Share, print, or manage the public profile</Text>
        </View>
      </View>
      <Icon name="arrow-right" size={18} color={COLORS.brand} />
    </TouchableOpacity>

    <View style={styles.tabEmpty}>
      <Icon name="heart-outline" size={40} color={COLORS.border} />
      <Text style={styles.tabEmptyText}>No applications yet</Text>
      <Text style={styles.tabEmptySubText}>
        {animal.isAdoptionReady
          ? 'Once adoption applications come in, they will appear here.'
          : 'Mark this animal as adoption-ready to start receiving applications.'}
      </Text>
    </View>
  </ScrollView>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const AnimalDetailScreen = ({ route, navigation }) => {
  const { animalId } = route.params;
  const [animal, setAnimal]   = useState(null);
  const [records, setRecords] = useState([]);
  const [events, setEvents]   = useState([]);
  const [scans, setScans]     = useState([]);
  const [activeTab, setTab]   = useState('Overview');
  const [refreshing, setRefreshing] = useState(false);
  const [orgId, setOrgId]     = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [org, animalData] = await Promise.all([
        getOrganization(),
        getAnimal(animalId),
      ]);
      const oid = org?.id || 'default';
      setOrgId(oid);
      setAnimal(animalData);
      if (animalData) {
        const [recs, evts, scanList] = await Promise.all([
          listMedicalRecords(oid, animalId),
          listAnimalEvents(oid, animalId),
          listScansByAnimal(animalId).catch(() => []),
        ]);
        setRecords(recs);
        setEvents(evts);
        setScans(scanList);
      }
    } catch (e) {
      console.warn('AnimalDetail load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [animalId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const toggleAdoptionReady = async () => {
    if (!animal) return;
    try {
      const updated = await updateAnimal(animal.id, { isAdoptionReady: !animal.isAdoptionReady });
      setAnimal(updated);
    } catch (e) { Alert.alert('Error', 'Could not update adoption status.'); }
  };

  if (!animal) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <Icon name="paw" size={40} color={COLORS.border} />
        <Text style={styles.tabEmptyText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const speciesIcon = SPECIES_ICON[animal.species] || 'paw';
  const displayName = animal.name || 'Unknown Animal';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <TouchableOpacity style={styles.heroBack} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.heroPhoto}>
          {animal.primaryPhotoUri ? (
            <Image source={{ uri: animal.primaryPhotoUri }} style={styles.heroImg} />
          ) : (
            <View style={styles.heroImgPlaceholder}>
              <Icon name={speciesIcon} size={40} color={COLORS.brand} />
            </View>
          )}
        </View>

        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroCaseId}>{animal.caseId}</Text>
          <View style={styles.heroChips}>
            <StatusChip variant={animal.status} size="sm" />
            <View style={{ marginLeft: 6 }}>
              <StatusChip variant={animal.healthStatus} size="sm" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('Scan', { animalId: animal.id })}
        >
          <Icon name="camera" size={18} color={COLORS.brand} />
          <Text style={styles.scanBtnText}>AI Scan</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <TabBar active={activeTab} onSelect={setTab} />

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'Overview'  && <OverviewTab animal={animal} />}
        {activeTab === 'Medical'   && (
          <MedicalTab
            records={records}
            onAddRecord={() => navigation.navigate('AddMedicalRecord', {
              animalId: animal.id,
              animalName: animal.name || 'Unknown',
              animalCaseId: animal.caseId,
            })}
          />
        )}
        {activeTab === 'Scans' && (
          <ScansTab
            scans={scans}
            onRunScan={() => navigation.navigate('Scan', { animalId: animal.id })}
            onScanPress={(scan) => navigation.navigate('ScanResult', {
              result: scan.result,
              heroUri: scan.heroUri,
              imageCount: scan.imageCount,
              totalImageCount: scan.imageCount,
            })}
          />
        )}
        {activeTab === 'Timeline'  && <TimelineTab events={events} />}
        {activeTab === 'Adoption'  && <AdoptionTab animal={animal} onToggleReady={toggleAdoptionReady} onViewProfile={() => navigation.navigate('AnimalAdoptionProfile', { animalId: animal.id })} />}
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },

  // Hero
  hero: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroBack: { padding: 4 },
  heroPhoto: {},
  heroImg: { width: 64, height: 64, borderRadius: RADIUS.md },
  heroImgPlaceholder: {
    width: 64, height: 64, borderRadius: RADIUS.md,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo:   { flex: 1 },
  heroName:   { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  heroCaseId: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },
  heroChips:  { flexDirection: 'row', marginTop: 6 },
  scanBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.brandLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.lg },
  scanBtnText:{ fontSize: 11, fontWeight: '700', color: COLORS.brand },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.brand },
  tabText:       { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.brand },

  // Tab content
  tabContent: { padding: SPACING.md, paddingBottom: SPACING.xl },

  // Section card
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.card,
  },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionCardTitle:  { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionAction:     { fontSize: 13, color: COLORS.brand, fontWeight: '600' },

  // Info rows
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, width: 120, fontWeight: '500' },
  infoValue: { fontSize: 13, color: COLORS.textPrimary, flex: 1 },

  // Medical records
  medRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingVertical: SPACING.sm },
  medIcon:      { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  medInfo:      { flex: 1 },
  medTitle:     { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  medSub:       { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  medDiagnosis: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontStyle: 'italic' },
  aiTag:        { backgroundColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm },
  aiTagText:    { fontSize: 9, fontWeight: '800', color: '#5B21B6' },
  divider:      { height: 1, backgroundColor: COLORS.borderLight },

  // Timeline
  timeline:     { gap: 0 },
  timelineItem: { position: 'relative' },
  timelineLeft: { paddingLeft: SPACING.sm },
  timelineLine: { position: 'absolute', left: 23, top: 40, bottom: 0, width: 1.5, backgroundColor: COLORS.border },

  // Event row
  eventRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingVertical: SPACING.sm, paddingBottom: SPACING.md },
  eventIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eventContent:  { flex: 1 },
  eventTitle:    { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  eventDesc:     { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  eventMeta:     { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  // Add record btn
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.brandLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  addBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.brand },

  // Empty state
  tabEmpty:        { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  tabEmptyText:    { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  tabEmptySubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl },

  // Adoption toggle
  toggleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  toggleLabel:  { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  toggleSub:    { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  toggle:       { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.border, padding: 2, justifyContent: 'center' },
  toggleOn:     { backgroundColor: COLORS.brand },
  toggleThumb:  { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.surface, alignSelf: 'flex-start' },
  toggleThumbOn:{ alignSelf: 'flex-end' },
  fieldLabel:   { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 4 },
  adoptionDesc: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },

  // AI Summary indicator (inside Adoption tab SectionCard)
  aiSummaryIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, backgroundColor: '#EDE9FE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.lg },
  aiSummaryIndicatorText: { fontSize: 12, fontWeight: '700', color: '#7C3AED', flex: 1 },

  // QR Profile CTA button
  qrProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1.5, borderColor: COLORS.brandMuted, ...SHADOW.card },
  qrProfileBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  qrProfileIcon: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: COLORS.brandLight, alignItems: 'center', justifyContent: 'center' },
  qrProfileBtnTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  qrProfileBtnSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  // Scan history card
  scanCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  scanThumb: { width: 52, height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.inputBackground },
  scanThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  scanCardInfo: { flex: 1 },
  scanStatusPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 4 },
  scanStatusText: { fontSize: 10, fontWeight: '700', color: COLORS.white, letterSpacing: 0.4 },
  scanDate: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  scanMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});

export default AnimalDetailScreen;
