// ─── AnimalIntakeScreen ───────────────────────────────────────────────────────
// Multi-step form to register a new rescued animal. Fast, clear, field-worker friendly.

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { createAnimal } from '../services/animalService';
import { recordIntakeEvent } from '../services/animalEventService';
import { getOrganization } from '../services/orgService';
import * as ImagePicker from 'react-native-image-picker';

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'species',  title: 'Species',       icon: 'paw' },
  { id: 'basics',   title: 'Basic Info',    icon: 'information' },
  { id: 'rescue',   title: 'Rescue Details',icon: 'map-marker' },
  { id: 'health',   title: 'Health & Notes',icon: 'heart-pulse' },
];

const SPECIES_OPTIONS = [
  { key: 'dog',     label: 'Dog',     icon: 'dog' },
  { key: 'cat',     label: 'Cat',     icon: 'cat' },
  { key: 'cow',     label: 'Cow',     icon: 'cow' },
  { key: 'buffalo', label: 'Buffalo', icon: 'cow' },
  { key: 'bird',    label: 'Bird',    icon: 'bird' },
  { key: 'rabbit',  label: 'Rabbit',  icon: 'rabbit' },
  { key: 'horse',   label: 'Horse',   icon: 'horse-variant' },
  { key: 'other',   label: 'Other',   icon: 'paw' },
];

const GENDER_OPTIONS   = ['male', 'female', 'unknown'];
const CONDITION_OPTIONS = [
  { key: 'critical', label: 'Critical',  color: COLORS.critical,  bg: COLORS.criticalBg },
  { key: 'poor',     label: 'Poor',      color: COLORS.attention, bg: COLORS.attentionBg },
  { key: 'fair',     label: 'Fair',      color: COLORS.brand,     bg: COLORS.brandLight },
  { key: 'good',     label: 'Good',      color: COLORS.healthy,   bg: COLORS.healthyBg },
];
const SOURCE_OPTIONS = [
  { key: 'street_rescue', label: '🛣️  Street Rescue' },
  { key: 'surrender',     label: '🤝 Owner Surrender' },
  { key: 'stray',         label: '🏠 Stray – Self-arrived' },
  { key: 'transfer',      label: '🔄 Transfer from Shelter' },
  { key: 'confiscation',  label: '🚔 Confiscation' },
  { key: 'other',         label: '📋 Other' },
];

// ── Reusable sub-components ───────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}{required && <Text style={{ color: COLORS.critical }}> *</Text>}</Text>
    {children}
  </View>
);

const Input = (props) => (
  <TextInput
    style={styles.input}
    placeholderTextColor={COLORS.placeholder}
    {...props}
  />
);

const OptionPill = ({ label, selected, color, bg, onPress }) => (
  <TouchableOpacity
    style={[styles.pill, selected && { backgroundColor: bg || COLORS.brandLight, borderColor: color || COLORS.brand }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[styles.pillText, selected && { color: color || COLORS.brand, fontWeight: '700' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ step, total }) => (
  <View style={styles.progressWrap}>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${((step + 1) / total) * 100}%` }]} />
    </View>
    <Text style={styles.progressText}>Step {step + 1} of {total}</Text>
  </View>
);

// ── Step 0: Species ───────────────────────────────────────────────────────────
const SpeciesStep = ({ form, update }) => (
  <View>
    <Text style={styles.stepHint}>Select the type of animal you are registering.</Text>
    <View style={styles.speciesGrid}>
      {SPECIES_OPTIONS.map(s => {
        const selected = form.species === s.key;
        return (
          <TouchableOpacity
            key={s.key}
            style={[styles.speciesTile, selected && styles.speciesTileActive]}
            onPress={() => update('species', s.key)}
            activeOpacity={0.75}
          >
            <Icon name={s.icon} size={32} color={selected ? COLORS.brand : COLORS.textSecondary} />
            <Text style={[styles.speciesTileText, selected && { color: COLORS.brand, fontWeight: '700' }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const BasicsStep = ({ form, update }) => {
  const pickImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      if (response.assets && response.assets.length > 0) {
        update('photoUrl', response.assets[0].uri);
      }
    });
  };

  return (
    <View style={styles.stepContent}>
      <Field label="Animal Photo">
        <TouchableOpacity style={styles.photoUploadBtn} onPress={pickImage} activeOpacity={0.8}>
          {form.photoUrl ? (
            <Image source={{ uri: form.photoUrl }} style={styles.photoPreview} />
          ) : (
            <>
              <Icon name="camera-plus" size={32} color={COLORS.textMuted} />
              <Text style={styles.photoUploadText}>Tap to add photo</Text>
            </>
          )}
        </TouchableOpacity>
      </Field>
      <Field label="Name (leave blank if unnamed)">
        <Input placeholder="e.g. Bruno" value={form.name} onChangeText={v => update('name', v)} />
      </Field>
    <Field label="Breed">
      <Input placeholder="e.g. Labrador, Mixed breed" value={form.breed} onChangeText={v => update('breed', v)} />
    </Field>
    <Field label="Gender" required>
      <View style={styles.pillRow}>
        {GENDER_OPTIONS.map(g => (
          <OptionPill key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={form.gender === g} onPress={() => update('gender', g)} />
        ))}
      </View>
    </Field>
    <Field label="Estimated Age">
      <Input placeholder="e.g. ~2 years, 8 months" value={form.estimatedAge} onChangeText={v => update('estimatedAge', v)} />
    </Field>
    <Field label="Weight (kg)">
      <Input placeholder="e.g. 12.5" keyboardType="decimal-pad" value={form.weightKg} onChangeText={v => update('weightKg', v)} />
    </Field>
    <Field label="Color / Markings">
      <Input placeholder="e.g. Brown with white patch on chest" value={form.colorMarkings} onChangeText={v => update('colorMarkings', v)} />
    </Field>
  </View>
  );
};

// ── Step 2: Rescue Details ────────────────────────────────────────────────────
const RescueStep = ({ form, update }) => (
  <View style={styles.stepContent}>
    <Field label="Intake Source" required>
      {SOURCE_OPTIONS.map(s => (
        <TouchableOpacity
          key={s.key}
          style={[styles.sourceRow, form.intakeSource === s.key && styles.sourceRowActive]}
          onPress={() => update('intakeSource', s.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.sourceLabel, form.intakeSource === s.key && { color: COLORS.brand, fontWeight: '700' }]}>
            {s.label}
          </Text>
          {form.intakeSource === s.key && <Icon name="check-circle" size={18} color={COLORS.brand} />}
        </TouchableOpacity>
      ))}
    </Field>
    <Field label="Rescue Location">
      <Input
        placeholder="e.g. Near Sector 14 Market, Delhi"
        value={form.intakeLocation}
        onChangeText={v => update('intakeLocation', v)}
      />
    </Field>
    <Field label="Rescued By">
      <Input
        placeholder="Staff or volunteer name"
        value={form.rescuedBy}
        onChangeText={v => update('rescuedBy', v)}
      />
    </Field>
    <Field label="Kennel / Enclosure Number">
      <Input
        placeholder="e.g. A-12, Block B"
        value={form.kennelNumber}
        onChangeText={v => update('kennelNumber', v)}
      />
    </Field>
  </View>
);

// ── Step 3: Health & Notes ────────────────────────────────────────────────────
const HealthStep = ({ form, update }) => (
  <View style={styles.stepContent}>
    <Field label="Condition at Intake" required>
      <View style={styles.pillRow}>
        {CONDITION_OPTIONS.map(c => (
          <OptionPill
            key={c.key}
            label={c.label}
            selected={form.intakeCondition === c.key}
            color={c.color}
            bg={c.bg}
            onPress={() => update('intakeCondition', c.key)}
          />
        ))}
      </View>
    </Field>
    <Field label="Neutered / Spayed">
      <View style={styles.pillRow}>
        <OptionPill label="Yes" selected={form.isNeutered === true}  onPress={() => update('isNeutered', true)} />
        <OptionPill label="No"  selected={form.isNeutered === false} onPress={() => update('isNeutered', false)} />
        <OptionPill label="Unknown" selected={form.isNeutered === null} onPress={() => update('isNeutered', null)} />
      </View>
    </Field>
    <Field label="Vaccinated">
      <View style={styles.pillRow}>
        <OptionPill label="Yes" selected={form.isVaccinated === true}  onPress={() => update('isVaccinated', true)} />
        <OptionPill label="No"  selected={form.isVaccinated === false} onPress={() => update('isVaccinated', false)} />
        <OptionPill label="Unknown" selected={form.isVaccinated === null} onPress={() => update('isVaccinated', null)} />
      </View>
    </Field>
    <Field label="Behaviour Notes">
      <Input
        placeholder="e.g. Fearful, Good with dogs, Aggressive with strangers…"
        value={form.behaviourNotes}
        onChangeText={v => update('behaviourNotes', v)}
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textarea]}
        textAlignVertical="top"
      />
    </Field>
    <Field label="Dietary Requirements">
      <Input
        placeholder="e.g. Soft food only, Diabetic diet…"
        value={form.dietaryRequirements}
        onChangeText={v => update('dietaryRequirements', v)}
      />
    </Field>
    <Field label="Special Needs">
      <Input
        placeholder="e.g. Needs twice daily insulin, Blind in left eye…"
        value={form.specialNeeds}
        onChangeText={v => update('specialNeeds', v)}
        multiline
        numberOfLines={2}
        style={[styles.input, styles.textarea]}
        textAlignVertical="top"
      />
    </Field>
    <Field label="Intake Notes">
      <Input
        placeholder="Any additional observations at the time of intake…"
        value={form.intakeNotes}
        onChangeText={v => update('intakeNotes', v)}
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textarea]}
        textAlignVertical="top"
      />
    </Field>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  species: '',
  name: '',
  breed: '',
  gender: 'unknown',
  estimatedAge: '',
  weightKg: '',
  colorMarkings: '',
  intakeDate: new Date().toISOString(),
  intakeSource: '',
  intakeLocation: '',
  rescuedBy: '',
  kennelNumber: '',
  intakeCondition: 'fair',
  isNeutered: null,
  isVaccinated: null,
  healthStatus: 'stable',
  behaviourNotes: '',
  dietaryRequirements: '',
  specialNeeds: '',
  intakeNotes: '',
  status: 'intake',
  isAdoptionReady: false,
  adoptionListingPublic: false,
  photoUris: [],
};

const AnimalIntakeScreen = ({ navigation }) => {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState(INITIAL_FORM);
  const [saving, setSaving]   = useState(false);
  const scrollRef             = useRef(null);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const canProceed = () => {
    if (step === 0) return !!form.species;
    if (step === 1) return !!form.gender;
    if (step === 2) return !!form.intakeSource;
    if (step === 3) return !!form.intakeCondition;
    return true;
  };

  const next = () => {
    if (!canProceed()) {
      Alert.alert('Required field', 'Please fill in the required fields before continuing.');
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleSubmit();
    }
  };

  const back = () => {
    if (step === 0) { navigation.goBack(); return; }
    setStep(s => s - 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const org  = await getOrganization();
      const orgId = org?.id || 'default';

      const intakeConditionMap = {
        critical: 'critical',
        poor: 'needs_attention',
        fair: 'stable',
        good: 'healthy',
      };

      const animal = await createAnimal({
        ...form,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        isNeutered:   form.isNeutered  ?? false,
        isVaccinated: form.isVaccinated ?? false,
        healthStatus: intakeConditionMap[form.intakeCondition] || 'stable',
      });

      // Auto-record intake event on the timeline
      await recordIntakeEvent(orgId, animal.id, animal.caseId, form.intakeSource, form.rescuedBy);

      Alert.alert(
        '✅ Animal Registered',
        `${form.name || 'Animal'} has been registered with Case ID ${animal.caseId}.`,
        [
          { text: 'View Profile', onPress: () => navigation.replace('AnimalDetail', { animalId: animal.id }) },
          { text: 'Add Another',  onPress: () => { setForm(INITIAL_FORM); setStep(0); } },
        ],
      );
    } catch (e) {
      console.error('Intake error:', e);
      Alert.alert('Error', 'Could not register animal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <SpeciesStep form={form} update={update} />;
      case 1: return <BasicsStep  form={form} update={update} />;
      case 2: return <RescueStep  form={form} update={update} />;
      case 3: return <HealthStep  form={form} update={update} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={back} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle}>New Intake</Text>
            <Text style={styles.topBarSub}>{STEPS[step].title}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress */}
        <ProgressBar step={step} total={STEPS.length} />

        {/* Content */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom nav */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.backNavBtn} onPress={back}>
            <Icon name="arrow-left" size={18} color={COLORS.brand} />
            <Text style={styles.backNavText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, (!canProceed() || saving) && styles.nextBtnDisabled]}
            onPress={next}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.textOnBrand} size="small" />
              : <>
                  <Text style={styles.nextBtnText}>{step === STEPS.length - 1 ? 'Register Animal' : 'Continue'}</Text>
                  <Icon name={step === STEPS.length - 1 ? 'check' : 'arrow-right'} size={18} color={COLORS.textOnBrand} />
                </>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  stepContent:   { gap: SPACING.md },
  stepHint: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.md, lineHeight: 20 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarCenter: { flex: 1, alignItems: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  topBarSub:   { fontSize: 12, color: COLORS.textSecondary },

  // Progress
  progressWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  progressTrack: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill:  { height: 4, backgroundColor: COLORS.brand, borderRadius: 2 },
  progressText:  { fontSize: 11, color: COLORS.textMuted, textAlign: 'right' },

  // Field
  field:      { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textarea: { minHeight: 80, paddingTop: 12 },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pillText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },

  // Species grid
  speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  speciesTile: {
    width: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 4,
    ...SHADOW.card,
  },
  speciesTileActive: { borderColor: COLORS.brand, backgroundColor: COLORS.brandLight },
  speciesTileText:   { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },

  // Source options
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  sourceRowActive: { borderColor: COLORS.brand, backgroundColor: COLORS.brandLight },
  sourceLabel:     { fontSize: 14, color: COLORS.textPrimary },

  // Bottom nav
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backNavText: { fontSize: 14, color: COLORS.brand, fontWeight: '600' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.brand,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    ...SHADOW.card,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: COLORS.textOnBrand, fontWeight: '700', fontSize: 14 },
  actionIcon: { marginRight: 6 },
  
  photoUploadBtn: {
    height: 120, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 2, borderColor: COLORS.borderLight, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs, overflow: 'hidden'
  },
  photoUploadText: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, fontWeight: '600' },
  photoPreview: { width: '100%', height: '100%' },
});

export default AnimalIntakeScreen;
