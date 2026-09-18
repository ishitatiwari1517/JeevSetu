// ─── AssignTaskScreen ─────────────────────────────────────────────────────────
// Admin screen to assign a task to a specific volunteer.
// Supports: task type, animal tagging, priority, scheduled time.
// Part of People tab only — no other screens affected.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { createTask } from '../services/volunteerService';
import { listAnimals } from '../services/animalService';
import { getOrganization } from '../services/orgService';

// ── Task type config ───────────────────────────────────────────────────────────
const TASK_TYPES = [
  { key: 'feed',         label: 'Feeding',          icon: 'food',                     color: '#F59E0B' },
  { key: 'medicate',     label: 'Medication',        icon: 'pill',                     color: '#EF4444' },
  { key: 'health_check', label: 'Health Check',      icon: 'stethoscope',              color: '#8B5CF6' },
  { key: 'vaccination',  label: 'Vaccination',       icon: 'needle',                   color: '#06B6D4' },
  { key: 'exercise',     label: 'Exercise / Walk',   icon: 'run',                      color: '#10B981' },
  { key: 'socialize',    label: 'Supervision',       icon: 'eye-outline',              color: '#3B82F6' },
  { key: 'groom',        label: 'Grooming',          icon: 'content-cut',              color: '#EC4899' },
  { key: 'clean',        label: 'Shed / Area Clean', icon: 'broom',                    color: '#6B7280' },
  { key: 'transport',    label: 'Movement / Transfer', icon: 'truck-outline',          color: '#F97316' },
  { key: 'rescue',       label: 'Rescue / Intake',   icon: 'ambulance',                color: '#DC2626' },
  { key: 'other',        label: 'Other',             icon: 'dots-horizontal-circle',   color: '#9CA3AF' },
];

const PRIORITIES = [
  { key: 'low',    label: 'Low',    color: COLORS.neutral },
  { key: 'normal', label: 'Normal', color: COLORS.brand   },
  { key: 'high',   label: 'High',   color: '#F59E0B'      },
  { key: 'urgent', label: 'Urgent', color: COLORS.critical },
];

// ── Helper ────────────────────────────────────────────────────────────────────
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';

const Field = ({ label, required, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={{ color: COLORS.critical }}> *</Text>}
    </Text>
    {children}
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const AssignTaskScreen = ({ route, navigation }) => {
  const { volunteerId, volunteerName } = route.params;

  const [taskType,     setTaskType]    = useState('feed');
  const [title,        setTitle]       = useState('');
  const [description,  setDescription] = useState('');
  const [priority,     setPriority]    = useState('normal');
  const [scheduledFor, setScheduled]   = useState(() => {
    // Default: today at 08:00
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d.toISOString();
  });
  const [dateText,     setDateText]    = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  });
  const [isRecurring,  setRecurring]   = useState(false);

  // Animal tagging
  const [animals,       setAnimals]    = useState([]);
  const [selectedAnimal, setSelAnimal] = useState(null);
  const [animalSearch,  setAnimalSrch] = useState('');
  const [showAnimalPicker, setShowPicker] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  const [saving, setSaving] = useState(false);

  // Load animals for the picker
  useEffect(() => {
    (async () => {
      setLoadingAnimals(true);
      try {
        const list = await listAnimals();
        setAnimals(list);
      } catch (e) { console.warn('AssignTask: animal load error', e); }
      finally { setLoadingAnimals(false); }
    })();
  }, []);

  // Auto-fill title when task type changes
  useEffect(() => {
    const t = TASK_TYPES.find(t => t.key === taskType);
    if (t) setTitle(t.label + (selectedAnimal ? ` — ${selectedAnimal.name}` : ''));
  }, [taskType, selectedAnimal]);

  // Parse a simple "DD/MM/YYYY HH:MM" date string into ISO
  const handleDateInput = (text) => {
    setDateText(text);
    // Try to parse dd/mm/yyyy hh:mm
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (match) {
      const [, d, m, y, h, min] = match;
      const parsed = new Date(+y, +m - 1, +d, +h, +min);
      if (!isNaN(parsed)) setScheduled(parsed.toISOString());
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a task title.'); return; }
    setSaving(true);
    try {
      const org = await getOrganization();
      const orgId = org?.id || 'default';
      await createTask(orgId, {
        assignedTo:       volunteerId,
        organizationId:   orgId,
        taskType,
        title:            title.trim(),
        description:      description.trim() || undefined,
        priority,
        scheduledFor,
        isRecurring,
        recurringPattern: isRecurring ? 'daily' : undefined,
        status:           'pending',
        animalId:         selectedAnimal?.id,
        animalName:       selectedAnimal?.name,
        animalCaseId:     selectedAnimal?.caseId,
      });
      Alert.alert(
        '✅ Task Assigned',
        `Task "${title.trim()}" assigned to ${volunteerName}.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Error', 'Could not assign task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredAnimals = animals.filter(a => {
    if (!animalSearch) return true;
    const q = animalSearch.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.caseId?.toLowerCase().includes(q) ||
      a.species?.toLowerCase().includes(q)
    );
  });

  const selectedType = TASK_TYPES.find(t => t.key === taskType) || TASK_TYPES[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topBarTitle}>Assign Task</Text>
            <Text style={styles.topBarSub}>To: {volunteerName}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Assign</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Task Type Grid */}
          <Field label="Task Type" required>
            <View style={styles.typeGrid}>
              {TASK_TYPES.map(t => {
                const active = taskType === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeCard, active && { borderColor: t.color, backgroundColor: t.color + '18' }]}
                    onPress={() => setTaskType(t.key)}
                    activeOpacity={0.75}
                  >
                    <Icon name={t.icon} size={22} color={active ? t.color : COLORS.textMuted} />
                    <Text style={[styles.typeLabel, active && { color: t.color, fontWeight: '700' }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Task Title */}
          <Field label="Task Title" required>
            <TextInput
              style={styles.input}
              placeholderTextColor={COLORS.placeholder}
              placeholder="e.g. Morning feed — Shed 2"
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          {/* Animal Tagging */}
          <Field label="Tag an Animal (optional)">
            <TouchableOpacity
              style={[styles.animalPickerBtn, selectedAnimal && { borderColor: COLORS.brand }]}
              onPress={() => setShowPicker(v => !v)}
              activeOpacity={0.8}
            >
              <Icon name="paw" size={18} color={selectedAnimal ? COLORS.brand : COLORS.textMuted} />
              <Text style={[styles.animalPickerText, selectedAnimal && { color: COLORS.textPrimary, fontWeight: '600' }]}>
                {selectedAnimal
                  ? `${selectedAnimal.name}  ·  ${capitalize(selectedAnimal.species)}${selectedAnimal.caseId ? '  ·  ' + selectedAnimal.caseId : ''}`
                  : 'Select an animal…'
                }
              </Text>
              {selectedAnimal && (
                <TouchableOpacity onPress={() => setSelAnimal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
              <Icon name={showAnimalPicker ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            {showAnimalPicker && (
              <View style={styles.animalDropdown}>
                <View style={styles.animalSearchRow}>
                  <Icon name="magnify" size={16} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.animalSearchInput}
                    placeholder="Search by name, ID or species…"
                    placeholderTextColor={COLORS.placeholder}
                    value={animalSearch}
                    onChangeText={setAnimalSrch}
                    autoFocus
                  />
                </View>
                {loadingAnimals ? (
                  <ActivityIndicator color={COLORS.brand} style={{ padding: 16 }} />
                ) : filteredAnimals.length === 0 ? (
                  <Text style={styles.animalEmpty}>No animals found.</Text>
                ) : (
                  filteredAnimals.slice(0, 20).map(a => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.animalRow, selectedAnimal?.id === a.id && styles.animalRowActive]}
                      onPress={() => { setSelAnimal(a); setShowPicker(false); setAnimalSrch(''); }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.speciesDot, { backgroundColor: a.species === 'dog' ? '#3B82F6' : a.species === 'cat' ? '#EC4899' : '#10B981' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.animalRowName}>{a.name || 'Unnamed'}</Text>
                        <Text style={styles.animalRowSub}>
                          {capitalize(a.species)}{a.breed ? '  ·  ' + a.breed : ''}{a.caseId ? '  ·  ' + a.caseId : ''}
                        </Text>
                      </View>
                      {selectedAnimal?.id === a.id && <Icon name="check" size={16} color={COLORS.brand} />}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </Field>

          {/* Priority */}
          <Field label="Priority">
            <View style={styles.pillRow}>
              {PRIORITIES.map(p => {
                const active = priority === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.priorityPill, active && { backgroundColor: p.color, borderColor: p.color }]}
                    onPress={() => setPriority(p.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.priorityText, active && { color: '#fff', fontWeight: '700' }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Scheduled Date & Time */}
          <Field label="Scheduled Date & Time (DD/MM/YYYY HH:MM)">
            <TextInput
              style={styles.input}
              placeholderTextColor={COLORS.placeholder}
              placeholder="e.g. 19/09/2026 07:30"
              value={dateText}
              onChangeText={handleDateInput}
              keyboardType="numbers-and-punctuation"
            />
          </Field>

          {/* Recurring toggle */}
          <View style={styles.recurringRow}>
            <View>
              <Text style={styles.fieldLabel}>Recurring Daily</Text>
              <Text style={styles.recurringDesc}>Repeat this task every day</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, isRecurring && styles.toggleOn]}
              onPress={() => setRecurring(v => !v)}
              activeOpacity={0.75}
            >
              <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Field label="Notes / Instructions">
            <TextInput
              style={[styles.input, { minHeight: 80, paddingTop: 12 }]}
              placeholderTextColor={COLORS.placeholder}
              placeholder="Any specific notes for this task…"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </Field>

          {/* Preview Card */}
          <View style={[styles.previewCard, { borderLeftColor: selectedType.color }]}>
            <View style={styles.previewHeader}>
              <Icon name={selectedType.icon} size={18} color={selectedType.color} />
              <Text style={[styles.previewType, { color: selectedType.color }]}>{selectedType.label}</Text>
              <View style={[styles.previewPriority, { backgroundColor: PRIORITIES.find(p => p.key === priority)?.color + '20' }]}>
                <Text style={[styles.previewPriorityText, { color: PRIORITIES.find(p => p.key === priority)?.color }]}>
                  {capitalize(priority)}
                </Text>
              </View>
            </View>
            <Text style={styles.previewTitle}>{title || '(Task title)'}</Text>
            {selectedAnimal && (
              <Text style={styles.previewAnimal}>
                🐾 {selectedAnimal.name}  ·  {selectedAnimal.caseId || capitalize(selectedAnimal.species)}
              </Text>
            )}
            <Text style={styles.previewTime}>📅 {dateText}{isRecurring ? '  ·  Repeats daily' : ''}</Text>
            <Text style={styles.previewAssignee}>👤 Assigned to {volunteerName}</Text>
          </View>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md },

  topBar:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn:     { padding: 4 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  topBarSub:   { fontSize: 11, color: COLORS.textSecondary },
  saveBtn:     { backgroundColor: COLORS.brand, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.lg },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  field:      { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  input:      { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary },

  // Task type grid
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeCard: { width: '30%', alignItems: 'center', gap: 5, paddingVertical: 12, paddingHorizontal: 8, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOW.card },
  typeLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500' },

  // Animal picker
  animalPickerBtn:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12 },
  animalPickerText: { flex: 1, fontSize: 13, color: COLORS.textMuted },
  animalDropdown:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', maxHeight: 280, ...SHADOW.card },
  animalSearchRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: SPACING.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  animalSearchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary, padding: 0 },
  animalRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: SPACING.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  animalRowActive: { backgroundColor: COLORS.brandLight },
  animalRowName:   { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  animalRowSub:    { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  animalEmpty:     { padding: SPACING.md, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 },
  speciesDot:      { width: 8, height: 8, borderRadius: 4 },

  // Priority
  pillRow:      { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  priorityPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  priorityText: { fontSize: 13, color: COLORS.textSecondary },

  // Recurring toggle
  recurringRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, ...SHADOW.card },
  recurringDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  toggle:        { width: 44, height: 26, borderRadius: 13, backgroundColor: COLORS.border, padding: 2 },
  toggleOn:      { backgroundColor: COLORS.brand },
  toggleThumb:   { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Preview card
  previewCard:         { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderLeftWidth: 4, gap: 5, ...SHADOW.card },
  previewHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  previewType:         { fontSize: 12, fontWeight: '700', flex: 1 },
  previewPriority:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
  previewPriorityText: { fontSize: 11, fontWeight: '700' },
  previewTitle:        { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  previewAnimal:       { fontSize: 12, color: COLORS.brand },
  previewTime:         { fontSize: 11, color: COLORS.textSecondary },
  previewAssignee:     { fontSize: 11, color: COLORS.textMuted },
});

export default AssignTaskScreen;
