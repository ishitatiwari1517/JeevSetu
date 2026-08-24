// ─── AddMedicalRecordScreen ───────────────────────────────────────────────────
// Add a medical record (checkup, treatment, vaccination, medication, AI scan result)
// to an animal's health file.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { createMedicalRecord } from '../services/medicalRecordService';
import { createAnimalEvent } from '../services/animalEventService';
import { getOrganization } from '../services/orgService';

// ── Record Types ──────────────────────────────────────────────────────────────
const RECORD_TYPES = [
  { key: 'checkup',        label: 'Checkup',       icon: 'stethoscope',      color: COLORS.brand },
  { key: 'vaccination',    label: 'Vaccination',   icon: 'needle',            color: COLORS.healthy },
  { key: 'treatment',      label: 'Treatment',     icon: 'medical-bag',       color: '#0891B2' },
  { key: 'surgery',        label: 'Surgery',       icon: 'scalpel',           color: '#7C3AED' },
  { key: 'medication_log', label: 'Medication',    icon: 'pill',              color: COLORS.attention },
  { key: 'deworming',      label: 'Deworming',     icon: 'bug',               color: '#059669' },
  { key: 'lab_result',     label: 'Lab Result',    icon: 'flask',             color: '#0891B2' },
  { key: 'injury',         label: 'Injury',        icon: 'bandage',           color: COLORS.critical },
  { key: 'observation',    label: 'Observation',   icon: 'eye',               color: COLORS.neutral },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}{required && <Text style={{ color: COLORS.critical }}> *</Text>}</Text>
    {children}
  </View>
);

const Input = ({ multiline, ...props }) => (
  <TextInput
    style={[styles.input, multiline && styles.textarea]}
    placeholderTextColor={COLORS.placeholder}
    multiline={multiline}
    textAlignVertical={multiline ? 'top' : 'auto'}
    {...props}
  />
);

const TypeTile = ({ item, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.typeTile, selected && { borderColor: item.color, backgroundColor: item.color + '15' }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Icon name={item.icon} size={22} color={selected ? item.color : COLORS.textSecondary} />
    <Text style={[styles.typeTileLabel, selected && { color: item.color, fontWeight: '700' }]}>
      {item.label}
    </Text>
  </TouchableOpacity>
);

// ── Medication Entry Sub-form ──────────────────────────────────────────────────
const MedicationForm = ({ medication, onChange }) => (
  <View style={styles.medSubForm}>
    <Text style={styles.medSubTitle}>Medication Details</Text>
    <Input
      placeholder="Medication name (e.g. Amoxicillin)"
      value={medication.name}
      onChangeText={v => onChange('name', v)}
    />
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Input
          placeholder="Dosage (e.g. 250mg)"
          value={medication.dosage}
          onChangeText={v => onChange('dosage', v)}
        />
      </View>
      <View style={{ width: SPACING.sm }} />
      <View style={{ flex: 1 }}>
        <Input
          placeholder="Frequency (e.g. Twice daily)"
          value={medication.frequency}
          onChangeText={v => onChange('frequency', v)}
        />
      </View>
    </View>
    <Input
      placeholder="Duration / End date (e.g. 7 days, until 15 Aug)"
      value={medication.endDate}
      onChangeText={v => onChange('endDate', v)}
    />
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const AddMedicalRecordScreen = ({ route, navigation }) => {
  const { animalId, animalName, animalCaseId } = route.params;

  const [recordType, setRecordType] = useState('checkup');
  const [title, setTitle]           = useState('');
  const [description, setDesc]      = useState('');
  const [diagnosis, setDiagnosis]   = useState('');
  const [treatment, setTreatment]   = useState('');
  const [vetName, setVetName]       = useState('');
  const [vetClinic, setVetClinic]   = useState('');
  const [cost, setCost]             = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [followUpRequired, setFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [medication, setMedication] = useState({ name: '', dosage: '', frequency: '', endDate: '' });
  const [saving, setSaving]         = useState(false);

  const updateMedication = (key, value) => setMedication(prev => ({ ...prev, [key]: value }));

  const getAutoTitle = (type) => {
    const labels = {
      checkup: 'Routine Checkup',
      vaccination: 'Vaccination',
      treatment: 'Treatment',
      surgery: 'Surgery',
      medication_log: 'Medication Started',
      deworming: 'Deworming',
      lab_result: 'Lab Result',
      injury: 'Injury Noted',
      observation: 'Observation',
    };
    return labels[type] || '';
  };

  const handleTypeSelect = (key) => {
    setRecordType(key);
    if (!title) setTitle(getAutoTitle(key));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for this record.');
      return;
    }
    if (!recordedBy.trim()) {
      Alert.alert('Required', 'Please enter who recorded this.');
      return;
    }
    setSaving(true);
    try {
      const org = await getOrganization();
      const orgId = org?.id || 'default';

      const medications = (recordType === 'medication_log' && medication.name)
        ? [{
            name: medication.name,
            dosage: medication.dosage || '—',
            frequency: medication.frequency || '—',
            startDate: new Date().toISOString(),
            endDate: medication.endDate || undefined,
          }]
        : [];

      await createMedicalRecord(orgId, {
        animalId,
        organizationId: orgId,
        recordedBy,
        recordType,
        title,
        description: description || undefined,
        diagnosis:   diagnosis || undefined,
        treatment:   treatment || undefined,
        medications: medications.length ? medications : undefined,
        cost:        cost ? parseFloat(cost) : undefined,
        vetName:     vetName || undefined,
        vetClinic:   vetClinic || undefined,
        followUpRequired,
        followUpDate: followUpDate || undefined,
        attachments:  [],
        aiGenerated:  false,
        recordedAt:   new Date().toISOString(),
      });

      // Auto-create timeline event
      await createAnimalEvent(orgId, {
        animalId,
        organizationId: orgId,
        eventType: recordType === 'vaccination' ? 'vaccination' : 'medical',
        title: `${title}`,
        description: description || undefined,
        performedBy: recordedBy,
        occurredAt: new Date().toISOString(),
      });

      Alert.alert('✅ Record Saved', `Medical record added for ${animalName || 'animal'}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error('Save medical record error:', e);
      Alert.alert('Error', 'Could not save record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const showsMedForm    = recordType === 'medication_log';
  const showsVetFields  = ['checkup', 'surgery', 'treatment', 'lab_result'].includes(recordType);
  const showsDiagnosis  = ['checkup', 'treatment', 'injury', 'lab_result'].includes(recordType);

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
            <Text style={styles.topBarTitle}>Add Medical Record</Text>
            <Text style={styles.topBarSub}>{animalName || 'Animal'} · {animalCaseId}</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.textOnBrand} size="small" />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Record Type */}
          <Field label="Record Type" required>
            <View style={styles.typeGrid}>
              {RECORD_TYPES.map(rt => (
                <TypeTile
                  key={rt.key}
                  item={rt}
                  selected={recordType === rt.key}
                  onPress={() => handleTypeSelect(rt.key)}
                />
              ))}
            </View>
          </Field>

          {/* Title */}
          <Field label="Title" required>
            <Input
              placeholder="e.g. Rabies Vaccination, Post-surgery checkup…"
              value={title}
              onChangeText={setTitle}
            />
          </Field>

          {/* Description */}
          <Field label="Notes / Description">
            <Input
              placeholder="Detailed observations or notes…"
              value={description}
              onChangeText={setDesc}
              multiline
              numberOfLines={3}
            />
          </Field>

          {/* Diagnosis / Treatment */}
          {showsDiagnosis && (
            <>
              <Field label="Diagnosis">
                <Input
                  placeholder="e.g. Mange, Fracture of right foreleg…"
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                />
              </Field>
              <Field label="Treatment Given">
                <Input
                  placeholder="e.g. Ivermectin injection, Bandaging…"
                  value={treatment}
                  onChangeText={setTreatment}
                  multiline
                  numberOfLines={2}
                />
              </Field>
            </>
          )}

          {/* Medication sub-form */}
          {showsMedForm && (
            <MedicationForm medication={medication} onChange={updateMedication} />
          )}

          {/* Vet details */}
          {showsVetFields && (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Vet Name">
                  <Input placeholder="Dr. Sharma" value={vetName} onChangeText={setVetName} />
                </Field>
              </View>
              <View style={{ width: SPACING.sm }} />
              <View style={{ flex: 1 }}>
                <Field label="Clinic">
                  <Input placeholder="Pet Care Clinic" value={vetClinic} onChangeText={setVetClinic} />
                </Field>
              </View>
            </View>
          )}

          {/* Cost */}
          <Field label="Cost (₹)">
            <Input
              placeholder="0"
              keyboardType="decimal-pad"
              value={cost}
              onChangeText={setCost}
            />
          </Field>

          {/* Recorded by */}
          <Field label="Recorded By" required>
            <Input
              placeholder="Your name or volunteer name"
              value={recordedBy}
              onChangeText={setRecordedBy}
            />
          </Field>

          {/* Follow-up */}
          <Field label="Follow-up Required">
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[styles.pill, followUpRequired && styles.pillActive]}
                onPress={() => setFollowUp(true)}
              >
                <Text style={[styles.pillText, followUpRequired && styles.pillTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, !followUpRequired && styles.pillActive]}
                onPress={() => setFollowUp(false)}
              >
                <Text style={[styles.pillText, !followUpRequired && styles.pillTextActive]}>No</Text>
              </TouchableOpacity>
            </View>
          </Field>

          {followUpRequired && (
            <Field label="Follow-up Date">
              <Input
                placeholder="e.g. 5 Aug 2026 or in 2 weeks"
                value={followUpDate}
                onChangeText={setFollowUpDate}
              />
            </Field>
          )}

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn:     { padding: 4 },
  topBarTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  topBarSub:   { fontSize: 12, color: COLORS.textSecondary },
  saveBtn:     { backgroundColor: COLORS.brand, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.lg },
  saveBtnText: { color: COLORS.textOnBrand, fontWeight: '700', fontSize: 13 },

  field:      { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary,
  },
  textarea: { minHeight: 80, paddingTop: 12 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeTile: {
    width: '30%', alignItems: 'center', paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, gap: 4,
  },
  typeTileLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },

  medSubForm: {
    backgroundColor: COLORS.brandLight, borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.brandMuted,
  },
  medSubTitle: { fontSize: 13, fontWeight: '700', color: COLORS.brandDark, marginBottom: 2 },

  row: { flexDirection: 'row', alignItems: 'flex-start' },

  pillRow: { flexDirection: 'row', gap: SPACING.sm },
  pill: {
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
  },
  pillActive:     { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  pillText:       { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  pillTextActive: { color: COLORS.textOnBrand, fontWeight: '700' },
});

export default AddMedicalRecordScreen;
