// ─── AddVolunteerScreen ───────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { createVolunteer } from '../services/volunteerService';
import { getOrganization } from '../services/orgService';

const DAY_OPTIONS = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const SHIFT_OPTIONS = [
  { key: 'morning', label: '🌅 Morning' }, { key: 'afternoon', label: '☀️ Afternoon' },
  { key: 'evening', label: '🌙 Evening' }, { key: 'flexible', label: '🔄 Flexible' },
];

const SKILL_OPTIONS = [
  { key: 'animal_handling', label: 'Animal Handling' },
  { key: 'veterinary_assist', label: 'Vet Assist' },
  { key: 'dog_training', label: 'Dog Training' },
  { key: 'first_aid', label: 'First Aid' },
  { key: 'driving', label: 'Driving' },
  { key: 'photography', label: 'Photography' },
  { key: 'social_media', label: 'Social Media' },
  { key: 'fundraising', label: 'Fundraising' },
  { key: 'admin', label: 'Admin' },
  { key: 'foster_care', label: 'Foster Care' },
  { key: 'cattle_handling', label: 'Cattle Handling' },
];

const Field = ({ label, required, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}{required && <Text style={{ color: COLORS.critical }}> *</Text>}</Text>
    {children}
  </View>
);

const Input = (props) => (
  <TextInput style={styles.input} placeholderTextColor={COLORS.placeholder} {...props} />
);

const Toggle = ({ label, value, onToggle }) => (
  <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.75}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <View style={[styles.toggle, value && styles.toggleOn]}>
      <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
    </View>
  </TouchableOpacity>
);

const AddVolunteerScreen = ({ navigation }) => {
  const [name, setName]           = useState('');
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [address, setAddress]     = useState('');
  const [emergency, setEmergency] = useState('');
  const [emergencyPhone, setEmPhone] = useState('');
  const [preferredShift, setShift] = useState('flexible');
  const [availableDays, setDays]  = useState([]);
  const [skills, setSkills]       = useState([]);
  const [canDoRescue, setRescue]  = useState(false);
  const [canDoMedical, setMedical] = useState(false);
  const [canDrive, setDrive]      = useState(false);
  const [canFoster, setFoster]    = useState(false);
  const [vehicleAvailable, setVehicle] = useState(false);
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  const toggleDay   = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter the volunteer\'s name.'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter a phone number.'); return; }
    setSaving(true);
    try {
      const org = await getOrganization();
      await createVolunteer(org?.id || 'default', {
        name, phone, email: email || undefined, address: address || undefined,
        emergencyContact: emergency || undefined, emergencyPhone: emergencyPhone || undefined,
        preferredShift, availableDays, skills,
        canDoRescue, canDoMedicalAssist: canDoMedical, canDrive, canFoster, vehicleAvailable,
        notes: notes || undefined,
        status: 'active',
        onboardingCompleted: false,
        idVerified: false,
        organizationId: org?.id || 'default',
        joinedAt: new Date().toISOString(),
      });
      Alert.alert('✅ Volunteer Added', `${name} has been registered.`, [
        { text: 'View List', onPress: () => navigation.goBack() },
        { text: 'Add Another', onPress: () => {
          setName(''); setPhone(''); setEmail(''); setAddress('');
          setEmergency(''); setEmPhone(''); setDays([]); setSkills([]);
          setRescue(false); setMedical(false); setDrive(false); setFoster(false);
        }},
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not add volunteer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Add Volunteer</Text>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.textOnBrand} size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Basic info */}
          <Field label="Full Name" required>
            <Input placeholder="e.g. Priya Sharma" value={name} onChangeText={setName} />
          </Field>
          <Field label="Phone Number" required>
            <Input placeholder="+91 98765 43210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          </Field>
          <Field label="Email">
            <Input placeholder="priya@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </Field>
          <Field label="Address">
            <Input placeholder="Home address" value={address} onChangeText={setAddress} />
          </Field>

          {/* Emergency */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Emergency Contact">
                <Input placeholder="Name" value={emergency} onChangeText={setEmergency} />
              </Field>
            </View>
            <View style={{ width: SPACING.sm }} />
            <View style={{ flex: 1 }}>
              <Field label="Emergency Phone">
                <Input placeholder="Phone" keyboardType="phone-pad" value={emergencyPhone} onChangeText={setEmPhone} />
              </Field>
            </View>
          </View>

          {/* Availability */}
          <Field label="Available Days">
            <View style={styles.dayRow}>
              {DAY_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dayPill, availableDays.includes(d.key) && styles.dayPillActive]}
                  onPress={() => toggleDay(d.key)}
                >
                  <Text style={[styles.dayPillText, availableDays.includes(d.key) && styles.dayPillTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Preferred Shift">
            <View style={styles.pillRow}>
              {SHIFT_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.pill, preferredShift === s.key && styles.pillActive]}
                  onPress={() => setShift(s.key)}
                >
                  <Text style={[styles.pillText, preferredShift === s.key && styles.pillTextActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Capabilities */}
          <Text style={styles.sectionHead}>Capabilities</Text>
          <View style={styles.togglesCard}>
            <Toggle label="Can do animal rescue" value={canDoRescue}  onToggle={() => setRescue(p => !p)} />
            <Toggle label="Can assist vet / medical" value={canDoMedical} onToggle={() => setMedical(p => !p)} />
            <Toggle label="Can drive" value={canDrive}    onToggle={() => setDrive(p => !p)} />
            <Toggle label="Can foster animals" value={canFoster}   onToggle={() => setFoster(p => !p)} />
            <Toggle label="Has vehicle available" value={vehicleAvailable} onToggle={() => setVehicle(p => !p)} />
          </View>

          {/* Skills */}
          <Field label="Skills">
            <View style={styles.skillGrid}>
              {SKILL_OPTIONS.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.skillPill, skills.includes(s.key) && styles.skillPillActive]}
                  onPress={() => toggleSkill(s.key)}
                >
                  <Text style={[styles.skillPillText, skills.includes(s.key) && styles.skillPillTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Notes">
            <TextInput
              style={[styles.input, { minHeight: 80, paddingTop: 12 }]}
              placeholder="Any additional notes about this volunteer…"
              placeholderTextColor={COLORS.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </Field>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, gap: SPACING.md },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 4 },
  topBarTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  saveBtn: { backgroundColor: COLORS.brand, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.lg },
  saveBtnText: { color: COLORS.textOnBrand, fontWeight: '700', fontSize: 13 },
  field:      { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 14, color: COLORS.textPrimary },
  row:  { flexDirection: 'row' },
  dayRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  dayPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  dayPillActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  dayPillText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  dayPillTextActive: { color: COLORS.textOnBrand },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  pillActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  pillText: { fontSize: 12, color: COLORS.textSecondary },
  pillTextActive: { color: COLORS.textOnBrand, fontWeight: '700' },
  sectionHead: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: -4 },
  togglesCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 0, ...SHADOW.card },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  toggleLabel: { fontSize: 13, color: COLORS.textPrimary },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: COLORS.border, padding: 2 },
  toggleOn: { backgroundColor: COLORS.brand },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  skillPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  skillPillActive: { backgroundColor: COLORS.brandLight, borderColor: COLORS.brand },
  skillPillText: { fontSize: 12, color: COLORS.textSecondary },
  skillPillTextActive: { color: COLORS.brand, fontWeight: '700' },
});

export default AddVolunteerScreen;
