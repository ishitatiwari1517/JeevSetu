import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ImageBackground, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import {
  SEVERITY_TONE, STATUS_BANNER,
  confidenceLabel, toPlainLanguage, visibleFindings,
} from '../services/scanResult';

const RISK_COLORS = {
  Low:      { bg: '#E1F4ED', fg: '#1F8A5F', icon: 'shield-check-outline' },
  Moderate: { bg: '#FFF3D6', fg: '#A77410', icon: 'shield-alert-outline' },
  High:     { bg: '#FCE7E7', fg: '#B53636', icon: 'shield-remove-outline' },
};

const ScanResultScreen = ({ navigation, route }) => {
  const { result, heroUri, imageCount, totalImageCount } = route?.params ?? {};
  const banner = STATUS_BANNER[result?.overallStatus] ?? STATUS_BANNER.NEEDS_ATTENTION;
  const findings = useMemo(() => visibleFindings(result?.findings ?? []), [result]);

  const goToVetFinder = () => {
    const query = '24 hour emergency veterinary clinic';
    const url = Platform.select({
      ios: `maps://?q=${encodeURIComponent(query)}`,
      android: `geo:0,0?q=${encodeURIComponent(query)}`,
    });
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
      });
  };
  
  const scheduleCheckup = () => navigation.navigate('Book');

  const riskColors = RISK_COLORS[result?.riskLevel] || RISK_COLORS.Low;
  const hasHealthAnalysis = result?.description ||
    (result?.observedConcerns?.length > 0) ||
    (result?.precautionarySteps?.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brandGreen} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PetVue</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heroLabel}>AI ANALYSIS COMPLETE</Text>
        <Text style={styles.heroTitle}>Scan Results</Text>

        <HeroCard banner={banner} heroUri={heroUri} />

        {imageCount && totalImageCount ? (
          <Text style={styles.confidenceMeta}>
            Analyzed {imageCount} of {totalImageCount} image{totalImageCount === 1 ? '' : 's'}
          </Text>
        ) : null}

        {/* ── 1. Description ── */}
        {result?.description ? (
          <SectionCard
            icon="text-box-outline"
            title="Description"
            iconColor={COLORS.primaryBlue}
          >
            <Text style={styles.sectionBody}>{result.description}</Text>
          </SectionCard>
        ) : null}

        {/* ── 2. Observed Concerns ── */}
        {result?.observedConcerns?.length > 0 ? (
          <SectionCard
            icon="eye-outline"
            title="Observed Concerns"
            iconColor="#B8521A"
          >
            {result.observedConcerns.map((concern, i) => (
              <View key={`concern-${i}`} style={styles.bulletRow}>
                <Icon name="circle-small" size={20} color="#B8521A" />
                <Text style={styles.bulletText}>{concern}</Text>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {/* ── 3. Reference Points ── */}
        {result?.referencePoints?.length > 0 ? (
          <SectionCard
            icon="lightbulb-on-outline"
            title="Reference Points"
            iconColor="#A77410"
          >
            {result.referencePoints.map((point, i) => (
              <View key={`ref-${i}`} style={styles.bulletRow}>
                <Icon name="information-outline" size={16} color="#A77410" style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {/* ── 4. Risk Level ── */}
        {result?.riskLevel ? (
          <View style={[styles.riskCard, { borderLeftColor: riskColors.fg }]}>
            <View style={styles.riskHeader}>
              <View style={[styles.riskIconWrap, { backgroundColor: riskColors.bg }]}>
                <Icon name={riskColors.icon} size={22} color={riskColors.fg} />
              </View>
              <View style={styles.riskTitleCol}>
                <Text style={styles.riskTitle}>Risk Level</Text>
                <View style={[styles.riskBadge, { backgroundColor: riskColors.bg }]}>
                  <Text style={[styles.riskBadgeText, { color: riskColors.fg }]}>
                    {result.riskLevel}
                  </Text>
                </View>
              </View>
            </View>
            {result.riskJustification ? (
              <Text style={styles.riskJustification}>{result.riskJustification}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ── Finding Cards (existing) ── */}
        {result?.overallStatus === 'HEALTHY' && !hasHealthAnalysis ? (
          <HealthyCard
            recommendation={result?.recommendation}
            onSchedule={scheduleCheckup}
          />
        ) : result?.overallStatus === 'HEALTHY' ? null : findings.length === 0 && !hasHealthAnalysis ? (
          <View style={styles.emptyCard}>
            <Icon name="image-search-outline" size={28} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>We need clearer photos</Text>
            <Text style={styles.emptyBody}>
              We couldn't determine a finding with confidence. Please retake the scan with brighter, sharper photos.
            </Text>
          </View>
        ) : (
          findings.map((f, idx) => <FindingCard key={`${f.condition}-${idx}`} finding={f} />)
        )}

        {/* ── 5. Immediate Precautionary Steps ── */}
        {result?.precautionarySteps?.length > 0 ? (
          <SectionCard
            icon="medical-bag"
            title="Immediate Precautionary Steps"
            iconColor={COLORS.brandGreen}
          >
            <Text style={styles.precautionSubtitle}>
              Actions you can take right now, before visiting the vet:
            </Text>
            {result.precautionarySteps.map((step, i) => (
              <View key={`step-${i}`} style={styles.stepRow}>
                <View style={styles.stepNumberWrap}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {/* ── 6. When to Seek Veterinary Help ── */}
        {result?.whenToSeekVet?.length > 0 ? (
          <SectionCard
            icon="hospital-box-outline"
            title="When to Seek Veterinary Help"
            iconColor="#B53636"
          >
            {result.whenToSeekVet.map((cond, i) => (
              <View key={`vet-${i}`} style={styles.vetCondRow}>
                <Icon name="alert-circle-outline" size={16} color="#B53636" style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{cond}</Text>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {/* ── 7. Disclaimer Banner ── */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerIconWrap}>
            <Icon name="shield-alert-outline" size={20} color="#6366F1" />
          </View>
          <View style={styles.disclaimerTextWrap}>
            <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={styles.disclaimerBody}>
              {result?.disclaimer ||
                'This assessment is based solely on the provided image and may not be accurate. Please consult a qualified veterinarian for a professional diagnosis.'}
            </Text>
          </View>
        </View>

        {result?.overallStatus !== 'HEALTHY' ? (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={goToVetFinder}>
              <Icon name="map-marker-radius" size={18} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>Find 24/7 Vet Near Me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={scheduleCheckup}>
              <Text style={styles.secondaryBtnText}>Schedule routine checkup</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={scheduleCheckup}>
            <Icon name="calendar-plus" size={18} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Schedule routine checkup</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/* ── Reusable Section Card ── */
const SectionCard = ({ icon, title, iconColor, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={20} color={iconColor || COLORS.brandGreen} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const HeroCard = ({ banner, heroUri }) => {
  const inner = (
    <View style={styles.heroCardInner}>
      <View style={[styles.statusPill, { backgroundColor: banner.tone }]}>
        <Icon name="alert-circle-outline" size={14} color={COLORS.white} />
        <Text style={styles.statusPillText}>{banner.label}</Text>
      </View>
    </View>
  );
  if (heroUri) {
    return (
      <ImageBackground
        source={{ uri: heroUri }}
        imageStyle={styles.heroImage}
        style={styles.heroCard}>
        <View style={styles.heroOverlay}>{inner}</View>
      </ImageBackground>
    );
  }
  return (
    <View style={[styles.heroCard, styles.heroCardFallback]}>{inner}</View>
  );
};

const HealthyCard = ({ recommendation, onSchedule }) => (
  <View style={styles.healthyCard}>
    <Icon name="check-decagram" size={44} color={COLORS.brandGreen} />
    <Text style={styles.healthyTitle}>Looks healthy</Text>
    <Text style={styles.healthyBody}>
      {recommendation || 'No concerning findings. Keep up the routine care and consider a periodic vet checkup.'}
    </Text>
    <TouchableOpacity style={styles.primaryBtn} onPress={onSchedule}>
      <Icon name="calendar-plus" size={18} color={COLORS.white} />
      <Text style={styles.primaryBtnText}>Schedule routine checkup</Text>
    </TouchableOpacity>
  </View>
);

const FindingCard = ({ finding }) => {
  const tone = SEVERITY_TONE[finding.severity];
  const label = confidenceLabel(finding.confidence);
  const language = toPlainLanguage(finding.plainLanguage || finding.condition);
  return (
    <View style={styles.findingCard}>
      <View style={styles.findingHeader}>
        <Text style={styles.findingTitle}>{finding.condition}</Text>
        <View style={[styles.severityPill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.severityPillText, { color: tone.fg }]}>{tone.label}</Text>
        </View>
      </View>

      <Text style={styles.confidenceLabel}>AI Confidence</Text>
      <View style={styles.confidenceRow}>
        <View style={styles.confidenceTrack}>
          <View
            style={[
              styles.confidenceFill,
              { width: `${finding.confidence}%`, backgroundColor: tone.fg },
            ]}
          />
        </View>
        <Text style={[styles.confidencePercent, { color: tone.fg }]}>{finding.confidence}%</Text>
      </View>
      <Text style={styles.confidenceWord}>{label} confidence</Text>

      {language ? <Text style={styles.findingLanguage}>"{language}"</Text> : null}

      {finding.visibleIndicators.length > 0 ? (
        <View style={styles.indicatorsRow}>
          {finding.visibleIndicators.map((ind, i) => (
            <View key={`${ind}-${i}`} style={styles.indicatorChip}>
              <Text style={styles.indicatorChipText}>{ind}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.brandGreen,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', color: COLORS.white, fontSize: 18, fontWeight: '700' },

  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  heroLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.7,
    color: COLORS.textSecondary, marginBottom: 4,
  },
  heroTitle: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  heroCard: {
    height: 180, borderRadius: 20, overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  heroCardFallback: { backgroundColor: '#1F2937' },
  heroImage: { borderRadius: 20 },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  heroCardInner: { flexDirection: 'row', justifyContent: 'flex-end' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: { color: COLORS.white, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  confidenceMeta: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.md },

  /* ── Section Card (reusable) ── */
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionBody: {
    fontSize: 13, color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletIcon: { marginTop: 2, marginRight: 6 },
  bulletText: {
    flex: 1, fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },

  /* ── Risk Card ── */
  riskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  riskIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  riskTitleCol: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 13, fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, marginTop: 4,
  },
  riskBadgeText: {
    fontSize: 13, fontWeight: '700',
  },
  riskJustification: {
    fontSize: 13, color: COLORS.textSecondary,
    marginTop: SPACING.sm, lineHeight: 19,
  },

  /* ── Precautionary Steps ── */
  precautionSubtitle: {
    fontSize: 12, color: COLORS.textSecondary,
    fontStyle: 'italic', marginBottom: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  stepNumberWrap: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.brandGreen,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 1,
  },
  stepNumber: {
    color: COLORS.white, fontSize: 12, fontWeight: '700',
  },
  stepText: {
    flex: 1, fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },

  /* ── When to seek vet ── */
  vetCondRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },

  /* ── Disclaimer Card ── */
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  disclaimerIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#E0E7FF',
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  disclaimerTextWrap: { flex: 1 },
  disclaimerTitle: {
    fontSize: 13, fontWeight: '700',
    color: '#4338CA', marginBottom: 4,
  },
  disclaimerBody: {
    fontSize: 12, color: '#4338CA',
    lineHeight: 17, fontStyle: 'italic',
  },

  /* ── Finding cards ── */
  findingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  findingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  findingTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  severityPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  severityPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  confidenceLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.7, marginBottom: 4 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  confidenceTrack: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: COLORS.inputBackground, overflow: 'hidden',
  },
  confidenceFill: { height: 6 },
  confidencePercent: { fontSize: 14, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  confidenceWord: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },

  findingLanguage: {
    fontSize: 13, fontStyle: 'italic',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm, lineHeight: 19,
    backgroundColor: COLORS.background,
    padding: SPACING.sm, borderRadius: 10,
  },
  indicatorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm },
  indicatorChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 10,
  },
  indicatorChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  healthyCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.md,
  },
  healthyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.sm },
  healthyBody: {
    fontSize: 13, color: COLORS.textSecondary, textAlign: 'center',
    marginVertical: SPACING.sm, lineHeight: 19,
  },

  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.lg,
    alignItems: 'center', marginBottom: SPACING.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.sm },
  emptyBody: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 14, borderRadius: 14,
    marginTop: SPACING.sm,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1.5, borderColor: COLORS.mintUnderline,
  },
  secondaryBtnText: { color: COLORS.brandGreen, fontSize: 14, fontWeight: '700' },
});

export default ScanResultScreen;
