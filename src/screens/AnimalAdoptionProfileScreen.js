// ─── AnimalAdoptionProfileScreen ──────────────────────────────────────────────────────
// Full adoption brochure for a single animal.
// Staff hands the phone to a potential adopter to read — or shares it.
// Contains: identity, rescue story, health, vaccinations, treatments,
//           diseases, behaviour, care requirements, AI adoption summary, QR code.

import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Share, RefreshControl, ActivityIndicator, Image,
  TextInput, Animated, Alert, Switch, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import { getAnimal, updateAnimal } from '../services/animalService';
import { listAllMedicalRecordsByAnimal } from '../services/medicalRecordService';
import { listAnimalEvents } from '../services/animalEventService';
import { getOrganization } from '../services/orgService';
import { generateAdoptionSummary, publishAdoptionSummary } from '../services/aiAdoptionSummaryService';
import { getPublicProfileUrl, getShareMessage, getPrintHtml, togglePublicProfile } from '../services/qrService';

const SPECIES_ICON = {
  dog: 'dog', cat: 'cat', cow: 'cow', buffalo: 'cow',
  bird: 'bird', rabbit: 'rabbit', horse: 'horse-variant', other: 'paw',
};
const SPECIES_COLOR = {
  dog: '#F59E0B', cat: '#8B5CF6', cow: '#10B981', buffalo: '#059669',
  bird: '#3B82F6', rabbit: '#EC4899', horse: '#6366F1', other: COLORS.brand,
};

const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '—';
const fmtDate = iso => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  : '—';

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon, title, color = COLORS.brand, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: color + '18' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, highlight }) =>
  value ? (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && { color: COLORS.brand, fontWeight: '700' }]}>{value}</Text>
    </View>
  ) : null;

// ── Skeleton loader ──────────────────────────────────────────────────────────────
const SkeletonLine = ({ width = '100%', height = 14 }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        styles.skeletonLine,
        { width, height, opacity },
      ]}
    />
  );
};

// ── AI Adoption Summary section ───────────────────────────────────────────────
const AiSummarySection = ({ animal, onSummaryUpdated }) => {
  const [generating, setGenerating] = useState(false);
  const [editedText, setEditedText] = useState(animal.aiAdoptionSummary || '');
  const [lastGenAt, setLastGenAt] = useState(null); // rate limiting
  const status = animal.aiSummaryStatus || 'none';

  const COOLDOWN_MS = 60_000; // 60 second cooldown between generations

  const handleGenerate = async () => {
    if (lastGenAt && Date.now() - lastGenAt < COOLDOWN_MS) {
      Alert.alert(
        'Please wait',
        'You can regenerate the summary once every 60 seconds.',
      );
      return;
    }
    if (status === 'published') {
      Alert.alert(
        'Replace Published Summary?',
        'This will unpublish the current summary and create a new draft. The staff must review and re-publish it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', onPress: () => doGenerate() },
        ],
      );
      return;
    }
    doGenerate();
  };

  const doGenerate = async () => {
    setGenerating(true);
    setLastGenAt(Date.now());
    try {
      const updated = await generateAdoptionSummary(animal.id);
      setEditedText(updated.aiAdoptionSummary || '');
      onSummaryUpdated(updated);
    } catch (err) {
      Alert.alert(
        'Generation Failed',
        err?.message || 'Could not connect to AI service. Please check your internet connection and try again.',
      );
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!editedText.trim()) {
      Alert.alert('Empty Summary', 'Please write or generate a summary before publishing.');
      return;
    }
    try {
      const updated = await publishAdoptionSummary(animal.id, editedText);
      onSummaryUpdated(updated);
    } catch (err) {
      Alert.alert('Error', 'Could not publish the summary.');
    }
  };

  return (
    <Section icon="creation" title="AI Adoption Summary" color="#7C3AED">
      {/* Status badge */}
      {status !== 'none' && (
        <View style={styles.summaryBadgeRow}>
          <View style={[
            styles.summaryBadge,
            { backgroundColor: status === 'published' ? COLORS.healthyBg : COLORS.attentionBg },
          ]}>
            <Icon
              name={status === 'published' ? 'check-circle' : 'pencil-circle'}
              size={12}
              color={status === 'published' ? COLORS.healthy : COLORS.attention}
            />
            <Text style={[styles.summaryBadgeText, {
              color: status === 'published' ? COLORS.healthy : COLORS.attention,
            }]}>
              {status === 'published' ? 'Published ✔' : 'Draft — Review before publishing'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleGenerate} disabled={generating} style={styles.regenBtn}>
            <Icon name="refresh" size={14} color={COLORS.textMuted} />
            <Text style={styles.regenBtnText}>Regenerate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skeleton while generating */}
      {generating && (
        <View style={styles.skeletonWrap}>
          <View style={styles.aiGeneratingRow}>
            <Icon name="creation" size={16} color="#7C3AED" />
            <Text style={styles.aiGeneratingText}>AI is writing the summary…</Text>
          </View>
          <SkeletonLine width="100%" height={14} />
          <SkeletonLine width="92%"  height={14} />
          <SkeletonLine width="88%"  height={14} />
          <SkeletonLine width="96%"  height={14} />
          <SkeletonLine width="80%"  height={14} />
        </View>
      )}

      {/* No summary yet */}
      {!generating && status === 'none' && (
        <View style={styles.summaryEmpty}>
          <View style={styles.summaryEmptyIcon}>
            <Icon name="creation" size={28} color="#7C3AED" />
          </View>
          <Text style={styles.summaryEmptyTitle}>No AI Summary Yet</Text>
          <Text style={styles.summaryEmptyDesc}>
            Generate a warm, professional adoption profile using this animal’s health data and behaviour notes.
          </Text>
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
            <Icon name="creation" size={16} color="#fff" />
            <Text style={styles.generateBtnText}>Generate with AI</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Draft — editable */}
      {!generating && status === 'draft' && (
        <View>
          <Text style={styles.summaryEditLabel}>Review and edit before publishing:</Text>
          <TextInput
            style={styles.summaryInput}
            value={editedText}
            onChangeText={setEditedText}
            multiline
            placeholder="AI summary will appear here…"
            placeholderTextColor={COLORS.textMuted}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
            <Icon name="check-circle" size={16} color="#fff" />
            <Text style={styles.publishBtnText}>Publish Summary</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Published — read only display */}
      {!generating && status === 'published' && (
        <View>
          <Text style={styles.summaryPublishedText}>{editedText}</Text>
          <TouchableOpacity
            style={styles.editSummaryBtn}
            onPress={() => onSummaryUpdated({ ...animal, aiSummaryStatus: 'draft' })}
          >
            <Icon name="pencil-outline" size={14} color={COLORS.brand} />
            <Text style={styles.editSummaryBtnText}>Edit Summary</Text>
          </TouchableOpacity>
        </View>
      )}
    </Section>
  );
};

// ── QR Code & Share section ─────────────────────────────────────────────────────
const QrSection = ({ animal, org, onAnimalUpdated }) => {
  const profileUrl = getPublicProfileUrl(animal, org);
  const isPublic = animal.publicProfileEnabled !== false; // default true

  const handleShare = async () => {
    const message = getShareMessage(animal, org);
    await Share.share({ message, title: `Adopt ${animal.name || 'this animal'}` });
  };

  const handleCopyLink = () => {
    Clipboard.setString(profileUrl);
    Alert.alert('Link Copied!', 'The profile link has been copied to your clipboard.');
  };

  const handlePrint = async () => {
    try {
      const RNPrint = require('react-native-print');
      const html = getPrintHtml(animal, org);
      await RNPrint.default.print({ html });
    } catch (err) {
      Alert.alert('Print Error', err?.message || 'Could not open print dialog.');
    }
  };

  const handleTogglePublic = async () => {
    try {
      const updated = await togglePublicProfile(animal, !isPublic);
      onAnimalUpdated(updated);
    } catch (err) {
      Alert.alert('Error', 'Could not update profile visibility.');
    }
  };

  return (
    <Section icon="qrcode" title="QR Code & Share" color={COLORS.brand}>
      {/* QR code */}
      <View style={styles.qrWrap}>
        <View style={styles.qrBorder}>
          <QRCode
            value={profileUrl}
            size={140}
            color={isPublic ? COLORS.brand : COLORS.textMuted}
            backgroundColor="#ffffff"
          />
        </View>
        <Text style={styles.qrUrl} numberOfLines={1}>{profileUrl}</Text>
        {!isPublic && (
          <View style={styles.qrHiddenBadge}>
            <Icon name="eye-off-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.qrHiddenText}>Profile is hidden from public view</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.qrActions}>
        <TouchableOpacity style={styles.qrActionBtn} onPress={handleShare}>
          <Icon name="share-variant" size={20} color={COLORS.brand} />
          <Text style={styles.qrActionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qrActionBtn} onPress={handlePrint}>
          <Icon name="printer-outline" size={20} color={COLORS.brand} />
          <Text style={styles.qrActionText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qrActionBtn} onPress={handleCopyLink}>
          <Icon name="link-variant" size={20} color={COLORS.brand} />
          <Text style={styles.qrActionText}>Copy Link</Text>
        </TouchableOpacity>
      </View>

      {/* Public profile toggle */}
      <View style={styles.qrToggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.qrToggleLabel}>Public Profile</Text>
          <Text style={styles.qrToggleSub}>
            {isPublic
              ? 'Anyone with the link can view this profile'
              : 'Profile is hidden — QR code is inactive'}
          </Text>
        </View>
        <Switch
          value={isPublic}
          onValueChange={handleTogglePublic}
          trackColor={{ true: COLORS.brand, false: COLORS.border }}
          thumbColor="#fff"
        />
      </View>

      {/* Last updated */}
      {animal.updatedAt && (
        <Text style={styles.qrLastUpdated}>
          Last updated {new Date(animal.updatedAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </Text>
      )}
    </Section>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const AnimalAdoptionProfileScreen = ({ route, navigation }) => {
  const { animalId } = route.params;
  const [animal, setAnimal]     = useState(null);
  const [records, setRecords]   = useState([]);
  const [events, setEvents]     = useState([]);
  const [org, setOrg]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const orgObj = await getOrganization();
      setOrg(orgObj);
      const oid = orgObj?.id || 'default';
      const [a, allRecords, evts] = await Promise.all([
        getAnimal(animalId),
        listAllMedicalRecordsByAnimal(oid),
        listAnimalEvents(oid, animalId),
      ]);
      setAnimal(a);
      setRecords(allRecords[animalId] || []);
      setEvents(evts);
    } catch (e) { console.warn('AdoptionProfile error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [animalId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ActivityIndicator size="large" color={COLORS.brand} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!animal) return null;

  const iconColor = SPECIES_COLOR[animal.species] || COLORS.brand;
  const iconBg    = iconColor + '18';

  // Parse records by type
  const vaccinations = records.filter(r => r.recordType === 'vaccination');
  const treatments   = records.filter(r => r.recordType === 'treatment' || r.recordType === 'surgery');
  const diagnoses    = records.filter(r => r.recordType === 'diagnosis');
  const medications  = records.flatMap(r => (r.medications || []).map(m => ({ ...m, recordTitle: r.title })));
  const activeMeds   = medications.filter(m => !m.endDate || new Date(m.endDate) > new Date());

  const handleShare = async () => {
    const message = getShareMessage(animal, org);
    await Share.share({ message, title: `Adoption Profile — ${animal.name || animal.caseId}` });
  };


  const healthColor = animal.healthStatus === 'healthy' ? COLORS.healthy
    : animal.healthStatus === 'critical' ? COLORS.critical
    : animal.healthStatus === 'needs_attention' ? COLORS.attention
    : COLORS.brand;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Icon name="arrow-left" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Adoption Profile</Text>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: iconColor }]} onPress={handleShare}>
          <Icon name="share-variant" size={16} color="#fff" />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.brand} />}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: iconBg }]}>
          {animal.photoUrl ? (
            <Image source={{ uri: animal.photoUrl }} style={styles.heroAvatarImage} />
          ) : (
            <View style={[styles.heroAvatar, { backgroundColor: iconColor + '22', borderColor: iconColor + '40' }]}>
              <Icon name={SPECIES_ICON[animal.species] || 'paw'} size={72} color={iconColor} />
            </View>
          )}
          <Text style={styles.heroName}>{animal.name || 'Unnamed'}</Text>
          <Text style={styles.heroSpecies}>
            {capitalize(animal.species)}{animal.breed ? ` · ${animal.breed}` : ''}
          </Text>
          <View style={styles.heroBadges}>
            <View style={[styles.heroBadge, { backgroundColor: healthColor + '20', borderColor: healthColor + '50' }]}>
              <Icon name="heart-pulse" size={12} color={healthColor} />
              <Text style={[styles.heroBadgeText, { color: healthColor }]}>{capitalize(animal.healthStatus || 'stable')}</Text>
            </View>
            {animal.isVaccinated && (
              <View style={[styles.heroBadge, { backgroundColor: COLORS.healthyBg, borderColor: COLORS.healthy + '50' }]}>
                <Icon name="needle" size={12} color={COLORS.healthy} />
                <Text style={[styles.heroBadgeText, { color: COLORS.healthy }]}>Vaccinated</Text>
              </View>
            )}
            {animal.isNeutered && (
              <View style={[styles.heroBadge, { backgroundColor: COLORS.brandLight, borderColor: COLORS.brandMuted }]}>
                <Icon name="check-circle" size={12} color={COLORS.brand} />
                <Text style={[styles.heroBadgeText, { color: COLORS.brand }]}>Neutered</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Identity ─────────────────────────────────────────────────────── */}
        <Section icon="card-account-details" title="Identity" color="#7C3AED">
          <InfoRow label="Case ID"  value={animal.caseId} />
          <InfoRow label="Species"  value={capitalize(animal.species)} />
          <InfoRow label="Breed"    value={animal.breed} />
          <InfoRow label="Gender"   value={capitalize(animal.gender || 'unknown')} />
          <InfoRow label="Est. Age" value={animal.estimatedAgeYears != null ? `~${animal.estimatedAgeYears} year(s)` : null} />
          <InfoRow label="Weight"   value={animal.weightKg ? `${animal.weightKg} kg` : null} />
          <InfoRow label="Microchip" value={animal.microchipId} />
          <InfoRow label="Colour"   value={animal.colour} />
        </Section>

        {/* ── Rescue Story ─────────────────────────────────────────────────── */}
        <Section icon="map-marker-radius" title="Rescue Story" color="#0891B2">
          <InfoRow label="Intake Date"     value={fmtDate(animal.intakeDate)} />
          <InfoRow label="Source"          value={capitalize(animal.intakeSource || '')} />
          <InfoRow label="Rescued from"    value={animal.rescueLocation} />
          <InfoRow label="Rescued by"      value={animal.rescuedBy} />
          <InfoRow label="Cond. at Intake" value={capitalize(animal.conditionAtIntake || '')} />
        </Section>

        {/* ── Health Status ─────────────────────────────────────────────────── */}
        <Section icon="heart-pulse" title="Health Status" color={healthColor}>
          <InfoRow label="Overall Health" value={capitalize(animal.healthStatus || 'stable')} />
          <InfoRow label="Vaccinated"     value={animal.isVaccinated ? '✅ Yes' : '❌ No'} />
          <InfoRow label="Neutered/Spayed" value={animal.isNeutered ? '✅ Yes' : '❌ No'} />
          <InfoRow label="Microchip"       value={animal.microchipId ? `✅ ${animal.microchipId}` : '❌ Not microchipped'} />
        </Section>

        {/* ── Vaccinations ─────────────────────────────────────────────────── */}
        {vaccinations.length > 0 && (
          <Section icon="needle" title="Vaccinations" color={COLORS.healthy}>
            {vaccinations.map(v => (
              <View key={v.id} style={styles.recordRow}>
                <Icon name="check-circle" size={16} color={COLORS.healthy} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordTitle}>{v.title}</Text>
                  <Text style={styles.recordDate}>{fmtDate(v.recordedAt)}</Text>
                  {v.description ? <Text style={styles.recordDesc}>{v.description}</Text> : null}
                </View>
              </View>
            ))}
          </Section>
        )}
        {vaccinations.length === 0 && (
          <Section icon="needle" title="Vaccinations" color={COLORS.attention}>
            <Text style={styles.emptyNote}>No vaccination records on file.</Text>
          </Section>
        )}

        {/* ── Treatments & Surgeries ────────────────────────────────────────── */}
        {treatments.length > 0 && (
          <Section icon="hospital-box" title="Treatments & Surgeries" color="#7C3AED">
            {treatments.map(t => (
              <View key={t.id} style={styles.recordRow}>
                <Icon name="stethoscope" size={16} color="#7C3AED" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordTitle}>{t.title}</Text>
                  <Text style={styles.recordDate}>{fmtDate(t.recordedAt)}</Text>
                  {t.description ? <Text style={styles.recordDesc}>{t.description}</Text> : null}
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* ── Diseases / Diagnoses ──────────────────────────────────────────── */}
        {diagnoses.length > 0 && (
          <Section icon="virus" title="Known Conditions / Diseases" color={COLORS.attention}>
            {diagnoses.map(d => (
              <View key={d.id} style={styles.recordRow}>
                <Icon name="alert-circle" size={16} color={COLORS.attention} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordTitle}>{d.title}</Text>
                  <Text style={styles.recordDate}>{fmtDate(d.recordedAt)}</Text>
                  {d.description ? <Text style={styles.recordDesc}>{d.description}</Text> : null}
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* ── Current Medications ──────────────────────────────────────────── */}
        {activeMeds.length > 0 && (
          <Section icon="pill" title="Current Medications" color={COLORS.attention}>
            {activeMeds.map((m, i) => (
              <View key={i} style={styles.recordRow}>
                <Icon name="pill" size={16} color={COLORS.attention} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordTitle}>{m.name}</Text>
                  {m.dosage    ? <Text style={styles.recordDesc}>Dose: {m.dosage}</Text> : null}
                  {m.frequency ? <Text style={styles.recordDesc}>Frequency: {m.frequency}</Text> : null}
                  {m.notes     ? <Text style={styles.recordDesc}>{m.notes}</Text> : null}
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* ── Behaviour ────────────────────────────────────────────────────── */}
        <Section icon="emoticon-happy-outline" title="Behaviour" color="#F59E0B">
          {animal.temperament ? (
            <Text style={styles.freeText}>{animal.temperament}</Text>
          ) : (
            <Text style={styles.emptyNote}>No behaviour notes recorded.</Text>
          )}
          {animal.isGoodWithKids !== undefined && (
            <InfoRow label="Good with kids" value={animal.isGoodWithKids ? '✅ Yes' : '❌ No'} />
          )}
          {animal.isGoodWithOtherAnimals !== undefined && (
            <InfoRow label="Good with other animals" value={animal.isGoodWithOtherAnimals ? '✅ Yes' : '❌ No'} />
          )}
          {animal.activityLevel && (
            <InfoRow label="Activity level" value={capitalize(animal.activityLevel)} />
          )}
        </Section>

        {/* ── Care Requirements ────────────────────────────────────────────── */}
        <Section icon="hand-heart" title="Care Requirements" color="#EC4899">
          {animal.specialNeeds ? (
            <View style={styles.recordRow}>
              <Icon name="alert" size={14} color={COLORS.attention} style={{ marginTop: 3 }} />
              <Text style={[styles.freeText, { flex: 1 }]}>{animal.specialNeeds}</Text>
            </View>
          ) : (
            <Text style={styles.emptyNote}>No special care needs noted.</Text>
          )}
          {animal.feedingNotes ? <InfoRow label="Feeding" value={animal.feedingNotes} /> : null}
          {animal.exerciseNeeds ? <InfoRow label="Exercise" value={animal.exerciseNeeds} /> : null}
          {animal.groomingNeeds ? <InfoRow label="Grooming" value={animal.groomingNeeds} /> : null}
        </Section>

        {/* ── About Me ─────────────────────────────────────────────────────── */}
        {animal.adoptionDescription ? (
          <Section icon="comment-text-outline" title="About Me" color={COLORS.brand}>
            <Text style={styles.freeText}>{animal.adoptionDescription}</Text>
          </Section>
        ) : null}

        {/* ── AI Adoption Summary ──────────────────────────────────────────── */}
        <AiSummarySection
          animal={animal}
          onSummaryUpdated={setAnimal}
        />

        {/* ── QR Code & Share ─────────────────────────────────────────────── */}
        <QrSection
          animal={animal}
          org={org}
          onAnimalUpdated={setAnimal}
        />

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Icon name="heart-circle" size={28} color={COLORS.brand} />
          <Text style={styles.footerText}>
            Profile by {org?.name || 'Animal Shelter'} · PetVue
          </Text>
          {org?.contactPhone && (
            <Text style={styles.footerContact}>📞 {org.contactPhone}</Text>
          )}
        </View>

        {/* Share CTA */}
        <TouchableOpacity style={[styles.shareFullBtn, { backgroundColor: iconColor }]} onPress={handleShare}>
          <Icon name="share-variant" size={20} color="#fff" />
          <Text style={styles.shareFullBtnText}>Share This Profile</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.background },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.lg },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  content: { paddingBottom: SPACING.xl },

  // Hero
  hero:       { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.md, gap: SPACING.sm },
  heroAvatar: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, borderColor: '#fff'
  },
  heroAvatarImage: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#fff',
    marginBottom: SPACING.md, backgroundColor: COLORS.surface
  },
  heroName:   { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  heroSpecies: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 },
  heroBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1.5 },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },

  // Sections
  section:       { backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginBottom: SPACING.sm, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOW.card },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionIconWrap: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.3 },

  // Info rows
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', flex: 1.2, textAlign: 'right' },

  // Record rows (vaccinations, treatments etc.)
  recordRow:   { flexDirection: 'row', gap: SPACING.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  recordTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  recordDate:  { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  recordDesc:  { fontSize: 12, color: COLORS.textSecondary, marginTop: 3, lineHeight: 17 },

  pill:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginRight: 4, marginBottom: 4 },
  pillText: { fontSize: 11, fontWeight: '700' },

  freeText:  { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  emptyNote: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },

  footer:       { alignItems: 'center', marginHorizontal: SPACING.md, marginTop: SPACING.md, gap: 4 },
  footerText:   { fontSize: 12, color: COLORS.textSecondary },
  footerContact: { fontSize: 12, color: COLORS.brand, fontWeight: '600' },

  shareFullBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.md, marginTop: SPACING.md, paddingVertical: 16, borderRadius: RADIUS.xl },
  shareFullBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // ── AI Adoption Summary styles ──────────────────────────────────────────────────
  skeletonLine: { backgroundColor: COLORS.borderLight, borderRadius: RADIUS.sm, marginBottom: 10 },
  skeletonWrap: { gap: 4 },
  aiGeneratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  aiGeneratingText: { fontSize: 13, color: '#7C3AED', fontWeight: '600' },

  summaryBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  summaryBadgeText: { fontSize: 11, fontWeight: '700' },
  regenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regenBtnText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },

  summaryEmpty: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  summaryEmptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  summaryEmptyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  summaryEmptyDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 12, borderRadius: RADIUS.xl, marginTop: 4 },
  generateBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  summaryEditLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  summaryInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.lg,
    padding: SPACING.md, fontSize: 14, color: COLORS.textPrimary,
    lineHeight: 22, minHeight: 160, backgroundColor: COLORS.surfaceSecondary,
  },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.healthy, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: SPACING.md },
  publishBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  summaryPublishedText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 23 },
  editSummaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, alignSelf: 'flex-start' },
  editSummaryBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.brand },

  // ── QR Code styles ──────────────────────────────────────────────────────────
  qrWrap: { alignItems: 'center', paddingVertical: SPACING.md },
  qrBorder: { padding: SPACING.md, backgroundColor: '#fff', borderRadius: RADIUS.xl, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOW.card },
  qrUrl: { fontSize: 11, color: COLORS.textMuted, marginTop: SPACING.sm, textAlign: 'center' },
  qrHiddenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  qrHiddenText: { fontSize: 11, color: COLORS.textMuted },
  qrActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: SPACING.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.borderLight },
  qrActionBtn: { alignItems: 'center', gap: 4, flex: 1 },
  qrActionText: { fontSize: 11, fontWeight: '600', color: COLORS.brand },
  qrToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.md, gap: SPACING.md },
  qrToggleLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  qrToggleSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  qrLastUpdated: { fontSize: 11, color: COLORS.textMuted, marginTop: SPACING.sm, textAlign: 'right' },
});

export default AnimalAdoptionProfileScreen;
