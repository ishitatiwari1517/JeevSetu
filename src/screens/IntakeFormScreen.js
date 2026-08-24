import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING } from '../theme/colors';
import { saveIntakeDraft, loadIntakeDraft, submitIntakeForm } from '../services/intakeService';
import { detectEmergency } from '../utils/emergencyDetect';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 'symptoms', title: 'Primary Symptom' },
  { id: 'severity', title: 'Severity' },
  { id: 'timeline', title: 'Duration & Frequency' },
  { id: 'changes', title: 'Recent Changes' },
  { id: 'notes', title: 'Additional Notes' },
  { id: 'review', title: 'Review & Submit' },
];

const SYMPTOMS = [
  { id: 'vomiting', label: 'Vomiting', icon: 'stomach' },
  { id: 'lethargy', label: 'Lethargy', icon: 'sleep' },
  { id: 'eating', label: 'Not eating', icon: 'food-off' },
  { id: 'limping', label: 'Limping', icon: 'bone' },
  { id: 'checkup', label: 'General Checkup', icon: 'stethoscope' },
  { id: 'other', label: 'Other', icon: 'plus-circle' },
];

const SEVERITIES = [
  {
    id: 'mild',
    label: 'Mild',
    description: 'Slight discomfort, still eating and active',
    icon: 'emoticon-happy-outline',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Noticeably unwell, reduced activity or appetite',
    icon: 'emoticon-neutral-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'severe',
    label: 'Severe',
    description: 'Very unwell, urgent attention needed',
    icon: 'emoticon-sad-outline',
    color: '#EF4444',
    bg: '#FEF2F2',
  },
];

const DURATIONS = ['Last few hours', 'Since yesterday', '2-3 days', 'Over a week'];
const FREQUENCIES = ['Happened once', '3 times in last hour', 'Constant', 'Intermittent'];

const CHANGES = [
  { id: 'diet', label: 'Diet changes' },
  { id: 'meds', label: 'New medication' },
  { id: 'env', label: 'Environment changes' },
  { id: 'activity', label: 'Reduced activity' },
  { id: 'stress', label: 'Stress indicators' },
];

const SYMPTOM_LABELS = Object.fromEntries(SYMPTOMS.map(s => [s.id, s.label]));
const CHANGE_LABELS = Object.fromEntries(CHANGES.map(c => [c.id, c.label]));

const ReviewRow = ({ label, value, valueColor }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text style={[styles.reviewValue, valueColor ? { color: valueColor } : null]} numberOfLines={3}>
      {value}
    </Text>
  </View>
);

const IntakeFormScreen = ({ navigation, route }) => {
  const {
    petId = '',
    petName = 'your pet',
    appointmentId,
  } = route?.params || {};

  // Stable appointmentId — generated once if not passed
  const stableAppointmentId = useRef(appointmentId || `appt-${Date.now()}`).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    petId,
    petName,
    appointmentId: stableAppointmentId,
    symptoms: [],
    otherSymptom: '',
    severity: '',
    duration: '',
    frequency: '',
    changes: [],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  // Load saved draft on mount
  useEffect(() => {
    loadIntakeDraft(stableAppointmentId)
      .then(draft => {
        if (draft) setFormData(prev => ({ ...prev, ...draft }));
      })
      .catch(console.warn);
  }, [stableAppointmentId]);

  // Autosave every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveIntakeDraft(formDataRef.current).catch(console.warn);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isEmergency = detectEmergency(formData);

  const isNextDisabled = () => {
    if (isSubmitting) return true;
    switch (currentStep) {
      case 0:
        return (
          formData.symptoms.length === 0 ||
          (formData.symptoms.includes('other') && !formData.otherSymptom.trim())
        );
      case 1:
        return !formData.severity;
      case 2:
        return !formData.duration || !formData.frequency;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    let submitted = false;
    try {
      await submitIntakeForm(formData);
      submitted = true;
    } catch (error) {
      const msg = error?.message || String(error);
      console.error('[IntakeForm] Submit failed:', msg);
      if (msg.includes('401') || msg.includes('Unauthorized')) {
        setSubmitError('Session expired. Please sign out and sign in again.');
      } else if (msg.includes('400') || msg.includes('Missing')) {
        setSubmitError('Missing pet information. Please select a pet from your profile first.');
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
    if (submitted) {
      navigation.navigate('Home');
    }
  };

  const toggleSymptom = id => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(id)
        ? prev.symptoms.filter(s => s !== id)
        : [...prev.symptoms, id],
    }));
  };

  const toggleChange = id => {
    setFormData(prev => ({
      ...prev,
      changes: prev.changes.includes(id)
        ? prev.changes.filter(c => c !== id)
        : [...prev.changes, id],
    }));
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {STEPS.map((step, index) => (
        <View
          key={step.id}
          style={[
            styles.progressSegment,
            index <= currentStep && styles.progressSegmentActive,
            index < currentStep && styles.progressSegmentCompleted,
          ]}
        />
      ))}
    </View>
  );

  const renderEmergencyBanner = () => {
    if (!isEmergency || currentStep < 1) return null;
    return (
      <View style={styles.emergencyBanner}>
        <Icon name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
        <Text style={styles.emergencyBannerText}>
          Consider contacting your vet immediately.
        </Text>
      </View>
    );
  };

  const renderSymptoms = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What's the main concern?</Text>
      <Text style={styles.stepSubtitle}>Select all that apply for {formData.petName}.</Text>
      <View style={styles.grid}>
        {SYMPTOMS.map(item => {
          const active = formData.symptoms.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.symptomCard, active && styles.activeCard]}
              onPress={() => toggleSymptom(item.id)}
            >
              <View style={[styles.iconCircle, active && styles.activeIconCircle]}>
                <Icon
                  name={item.icon}
                  size={24}
                  color={active ? COLORS.white : COLORS.primaryBlue}
                />
              </View>
              <Text style={[styles.cardText, active && styles.activeCardText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {formData.symptoms.includes('other') && (
        <View style={styles.otherInputContainer}>
          <Icon name="pencil-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.otherInput}
            placeholder="Describe the symptom..."
            placeholderTextColor={COLORS.placeholder}
            value={formData.otherSymptom}
            onChangeText={text => setFormData(prev => ({ ...prev, otherSymptom: text }))}
            returnKeyType="done"
          />
        </View>
      )}
    </View>
  );

  const renderSeverity = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How severe is it?</Text>
      <Text style={styles.stepSubtitle}>Rate {formData.petName}'s current condition.</Text>
      <View style={styles.severityContainer}>
        {SEVERITIES.map(item => {
          const active = formData.severity === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.severityCard,
                active && { borderColor: item.color, backgroundColor: item.bg },
              ]}
              onPress={() => setFormData(prev => ({ ...prev, severity: item.id }))}
              activeOpacity={0.8}
            >
              <View style={[styles.severityIconWrap, { backgroundColor: item.bg }]}>
                <Icon
                  name={item.icon}
                  size={30}
                  color={active ? item.color : COLORS.textSecondary}
                />
              </View>
              <View style={styles.severityTextBlock}>
                <Text style={[styles.severityLabel, active && { color: item.color }]}>
                  {item.label}
                </Text>
                <Text style={styles.severityDesc}>{item.description}</Text>
              </View>
              {active && <Icon name="check-circle" size={22} color={item.color} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTimeline = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Duration & Frequency</Text>
      <Text style={styles.label}>How long has this been going on?</Text>
      <View style={styles.selectorContainer}>
        {DURATIONS.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.selectorItem, formData.duration === item && styles.activeSelector]}
            onPress={() => setFormData(prev => ({ ...prev, duration: item }))}
          >
            <Text style={[styles.selectorText, formData.duration === item && styles.activeSelectorText]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.label, { marginTop: 24 }]}>How often does it happen?</Text>
      <View style={styles.selectorContainer}>
        {FREQUENCIES.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.selectorItem, formData.frequency === item && styles.activeSelector]}
            onPress={() => setFormData(prev => ({ ...prev, frequency: item }))}
          >
            <Text style={[styles.selectorText, formData.frequency === item && styles.activeSelectorText]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderChanges = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Any recent changes?</Text>
      <Text style={styles.stepSubtitle}>Help us identify potential triggers.</Text>
      <View style={styles.chipContainer}>
        {CHANGES.map(item => {
          const active = formData.changes.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, active && styles.activeChip]}
              onPress={() => toggleChange(item.id)}
            >
              <Text style={[styles.chipText, active && styles.activeChipText]}>
                {item.label}
              </Text>
              {active && <Icon name="check" size={16} color={COLORS.white} style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderNotes = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Anything else?</Text>
      <Text style={styles.stepSubtitle}>
        Provide more details or describe the issue in your own words.
      </Text>
      <View style={styles.textAreaContainer}>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          placeholder={`e.g., ${formData.petName} is less active than usual and skipped breakfast today...`}
          placeholderTextColor={COLORS.placeholder}
          value={formData.notes}
          onChangeText={text => setFormData(prev => ({ ...prev, notes: text }))}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.voiceBtn}>
          <Icon name="microphone" size={20} color={COLORS.primaryBlue} />
          <Text style={styles.voiceBtnText}>Use Voice-to-Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReview = () => {
    const symptomLabels = formData.symptoms
      .map(id => (id === 'other' ? formData.otherSymptom || 'Other' : SYMPTOM_LABELS[id]))
      .filter(Boolean)
      .join(', ');
    const changeLabels = formData.changes
      .map(id => CHANGE_LABELS[id])
      .filter(Boolean)
      .join(', ');
    const severityItem = SEVERITIES.find(s => s.id === formData.severity);
    const severityLabel = severityItem
      ? severityItem.label
      : '—';

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Review your answers</Text>
        <Text style={styles.stepSubtitle}>
          Double-check before submitting to your vet.
        </Text>

        {isEmergency && (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyCardRow}>
              <Icon name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.emergencyCardTitle}>Urgent attention may be needed</Text>
            </View>
            <Text style={styles.emergencyCardBody}>
              Based on {formData.petName}'s symptoms and severity, consider calling your vet or an emergency clinic immediately.
            </Text>
          </View>
        )}

        <View style={styles.reviewCard}>
          <ReviewRow label="Symptoms" value={symptomLabels || '—'} />
          <View style={styles.reviewDivider} />
          <ReviewRow
            label="Severity"
            value={severityLabel}
            valueColor={severityItem ? severityItem.color : undefined}
          />
          <View style={styles.reviewDivider} />
          <ReviewRow label="Duration" value={formData.duration || '—'} />
          <View style={styles.reviewDivider} />
          <ReviewRow label="Frequency" value={formData.frequency || '—'} />
          <View style={styles.reviewDivider} />
          <ReviewRow
            label="Recent changes"
            value={changeLabels || 'None reported'}
          />
          {formData.notes.trim() !== '' && (
            <>
              <View style={styles.reviewDivider} />
              <ReviewRow label="Notes" value={formData.notes} />
            </>
          )}
        </View>

        {submitError && (
          <View style={styles.errorBanner}>
            <Icon name="alert" size={16} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{submitError}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (currentStep) {
      case 0: return renderSymptoms();
      case 1: return renderSeverity();
      case 2: return renderTimeline();
      case 3: return renderChanges();
      case 4: return renderNotes();
      case 5: return renderReview();
      default: return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Intake Form</Text>
          <Text style={styles.headerStep}>
            Step {currentStep + 1} of {STEPS.length}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {renderProgressBar()}
      {renderEmergencyBanner()}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextBtnContainer,
              isNextDisabled() && styles.disabledBtn,
            ]}
            onPress={handleNext}
            disabled={isNextDisabled()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primaryBlue, '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtn}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {isLastStep ? 'Submit to Vet' : 'Continue'}
                  </Text>
                  <Icon
                    name={isLastStep ? 'send' : 'arrow-right'}
                    size={20}
                    color={COLORS.white}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: { padding: 8 },
  closeBtn: { padding: 8 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  headerStep: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },

  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  progressSegmentActive: { backgroundColor: COLORS.primaryBlue },
  progressSegmentCompleted: { backgroundColor: COLORS.brandGreen },

  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emergencyBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },

  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 40 },
  stepContainer: { paddingTop: 10 },
  stepTitle: { fontSize: 26, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 22 },

  // Symptoms
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  symptomCard: {
    width: (width - SPACING.lg * 2 - 16) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCard: { borderColor: COLORS.primaryBlue, backgroundColor: '#EFF6FF' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  activeIconCircle: { backgroundColor: COLORS.primaryBlue },
  cardText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  activeCardText: { color: COLORS.primaryBlue },
  otherInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 4,
  },
  otherInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 10,
  },

  // Severity
  severityContainer: { gap: 14 },
  severityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  severityIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  severityTextBlock: { flex: 1 },
  severityLabel: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 3 },
  severityDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },

  // Timeline
  label: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  selectorContainer: { gap: 10 },
  selectorItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeSelector: { backgroundColor: '#EFF6FF', borderColor: COLORS.primaryBlue },
  selectorText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  activeSelectorText: { color: COLORS.primaryBlue },

  // Changes
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: { backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  activeChipText: { color: COLORS.white },

  // Notes
  textAreaContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  textArea: { fontSize: 16, color: COLORS.textPrimary, minHeight: 120 },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  voiceBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primaryBlue, marginLeft: 8 },

  // Review
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emergencyCardTitle: { fontSize: 15, fontWeight: '800', color: '#DC2626', flex: 1 },
  emergencyCardBody: { fontSize: 13, color: '#DC2626', lineHeight: 18 },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  reviewLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', flex: 0.9 },
  reviewValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '700', flex: 1.1, textAlign: 'right' },
  reviewDivider: { height: 1, backgroundColor: '#E2E8F0' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: { fontSize: 14, color: '#DC2626', fontWeight: '600', flex: 1 },

  // Footer
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: COLORS.white,
  },
  nextBtnContainer: {
    borderRadius: 20,
    elevation: 4,
    shadowColor: COLORS.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  nextBtn: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { fontSize: 17, fontWeight: '800', color: COLORS.white },
  disabledBtn: { opacity: 0.45, elevation: 0, shadowOpacity: 0 },
});

export default IntakeFormScreen;
