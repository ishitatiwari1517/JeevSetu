import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  StatusBar, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import { createPet, updatePet, setPetAvatar, getPet, deletePet } from '../services/petService';
import { validate } from './petForm.validate';

const AVATAR_OPTIONS = {
  mediaType: 'photo',
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.85,
};

const GENDERS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'unknown', label: 'Unknown' },
];

const PetFormScreen = ({ navigation, route }) => {
  const petId = route?.params?.petId;
  const isEdit = Boolean(petId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('unknown');
  const [dob, setDob] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    getPet(petId)
      .then(pet => {
        if (!active || !pet) return;
        setName(pet.name);
        setBreed(pet.breed);
        setGender(pet.gender);
        setDob(pet.dob);
        setWeightKg(String(pet.weightKg));
        setAvatarUri(pet.avatarUri ?? null);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isEdit, petId]);

  const pickAvatar = () => {
    Alert.alert('Pet photo', 'Choose a source', [
      {
        text: 'Take Photo',
        onPress: () => launchCamera(AVATAR_OPTIONS, response => {
          if (response.didCancel || response.errorCode) return;
          const uri = response.assets?.[0]?.uri;
          if (uri) { setAvatarUri(uri); setAvatarChanged(true); }
        }),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => launchImageLibrary(AVATAR_OPTIONS, response => {
          if (response.didCancel || response.errorCode) return;
          const uri = response.assets?.[0]?.uri;
          if (uri) { setAvatarUri(uri); setAvatarChanged(true); }
        }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    const formErrors = validate({ name, breed, dob, weightKg });
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        breed: breed.trim(),
        gender,
        dob,
        weightKg: Number(weightKg),
      };
      let pet;
      if (isEdit) {
        pet = await updatePet(petId, input);
      } else {
        pet = await createPet(input);
      }
      if (avatarUri && avatarChanged) {
        await setPetAvatar(pet.id, avatarUri);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', err?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove pet?',
      'This will delete the pet profile and any local data tied to it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(petId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('Could not remove', err?.message ?? 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const headerTitle = useMemo(() => (isEdit ? 'Edit pet' : 'Add a pet'), [isEdit]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="camera-plus-outline" size={28} color={COLORS.textSecondary} />
              <Text style={styles.avatarHint}>Add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Field label="Name" error={errors.name}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Bruno"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="words"
          />
        </Field>

        <Field label="Breed" error={errors.breed}>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder="Golden Retriever"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="words"
          />
        </Field>

        <Field label="Gender">
          <View style={styles.genderRow}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g.key}
                style={[styles.genderChip, gender === g.key && styles.genderChipActive]}
                onPress={() => setGender(g.key)}>
                <Text style={[styles.genderText, gender === g.key && styles.genderTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Date of birth" error={errors.dob}>
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
        </Field>

        <Field label="Weight (kg)" error={errors.weightKg}>
          <TextInput
            style={styles.input}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="22.4"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="decimal-pad"
          />
        </Field>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveText}>{isEdit ? 'Save changes' : 'Add pet'}</Text>
          )}
        </TouchableOpacity>

        {isEdit ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteText}>Remove pet</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({ label, error, children }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  avatarWrap: { alignSelf: 'center', marginBottom: SPACING.lg },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: COLORS.inputBackground },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarHint: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  field: { marginBottom: SPACING.md },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
    marginBottom: SPACING.xs, letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldError: { color: '#B53636', fontSize: 12, marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: SPACING.sm },
  genderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderChipActive: { backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen },
  genderText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  genderTextActive: { color: COLORS.white },
  saveBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.brandGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  deleteBtn: { marginTop: SPACING.md, alignItems: 'center', paddingVertical: 10 },
  deleteText: { color: '#B53636', fontSize: 14, fontWeight: '600' },
});

export default PetFormScreen;
