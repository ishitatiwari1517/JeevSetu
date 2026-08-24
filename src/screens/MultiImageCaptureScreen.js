import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import {
  MIN_IMAGES, MAX_IMAGES,
  assignQuality, computeConfidence, formatBytes,
  qualityDisplay, qualityReason,
} from './multiImageCapture';

const PICKER_OPTIONS = {
  mediaType: 'photo',
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  includeBase64: true,
};

/**
 * react-native-image-picker can return non-standard MIME types like "image/jpg"
 * (not valid — the standard is "image/jpeg"). Anthropic rejects anything that
 * isn't one of: image/jpeg, image/png, image/gif, image/webp.
 * This helper normalises to a supported value.
 */
const VALID_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const EXT_TO_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',  gif: 'image/gif', webp: 'image/webp',
};

const sanitizeMediaType = (rawType, fileName) => {
  // Normalise common non-standard alias
  let t = (rawType || '').toLowerCase().trim();
  if (t === 'image/jpg') t = 'image/jpeg';
  if (VALID_MEDIA_TYPES.has(t)) return t;

  // Fallback: derive from file extension
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];

  // Ultimate default
  return 'image/jpeg';
};

const QUALITY_TONE = {
  green: { bg: '#E1F4ED', fg: '#1F8A5F' },
  amber: { bg: '#FFF3D6', fg: '#A77410' },
  red:   { bg: '#FCE7E7', fg: '#B53636' },
};

let nextAssetId = 0;

const MultiImageCaptureScreen = ({ navigation, route }) => {
  const { animalId } = route?.params ?? {};
  const [assets, setAssets] = useState([]);

  const confidence = useMemo(() => computeConfidence(assets), [assets]);
  const canRunScan = assets.length >= MIN_IMAGES;
  const canAddMore = assets.length < MAX_IMAGES;

  const addAsset = (rnAsset) => {
    if (!rnAsset?.uri) return;
    const captured = {
      id: `asset-${++nextAssetId}`,
      uri: rnAsset.uri,
      base64: rnAsset.base64 || undefined,
      mediaType: sanitizeMediaType(rnAsset.type, rnAsset.fileName),
      fileName: rnAsset.fileName || `IMG_${String(nextAssetId).padStart(4, '0')}.jpg`,
      fileSize: rnAsset.fileSize,
      quality: assignQuality(rnAsset),
      qualityReason: '',
    };
    captured.qualityReason = qualityReason(captured.quality);
    setAssets(prev => (prev.length >= MAX_IMAGES ? prev : [...prev, captured]));
  };

  const handlePick = () => {
    if (!canAddMore) {
      Alert.alert('Photo limit reached', `You can capture up to ${MAX_IMAGES} photos.`);
      return;
    }
    Alert.alert('Add a photo', 'Choose a source', [
      {
        text: 'Take Photo',
        onPress: () => launchCamera(PICKER_OPTIONS, response => {
          if (response.didCancel || response.errorCode) return;
          addAsset(response.assets?.[0]);
        }),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => launchImageLibrary(PICKER_OPTIONS, response => {
          if (response.didCancel || response.errorCode) return;
          addAsset(response.assets?.[0]);
        }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemove = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const handleRunScan = () => {
    if (!canRunScan) return;
    navigation.navigate('ScanProcessing', { assets, animalId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan your pet</Text>
        <View style={styles.aiPill}>
          <Icon name="star-four-points" size={12} color={COLORS.brandGreen} />
          <Text style={styles.aiPillText}>AI Assistant</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heroTitle}>Detailed Diagnosis</Text>
        <Text style={styles.heroSubtitle}>
          Upload clear, well-lit photos of the affected area. Multiple angles improve AI accuracy.
        </Text>

        <TouchableOpacity
          style={[styles.uploadZone, !canAddMore && styles.uploadZoneDisabled]}
          onPress={handlePick}
          activeOpacity={0.85}
          disabled={!canAddMore}>
          <View style={styles.uploadIcon}>
            <Icon name="camera-outline" size={26} color={COLORS.brandGreen} />
          </View>
          <Text style={styles.uploadTitle}>
            {canAddMore ? 'Tap to upload or capture' : 'Photo limit reached'}
          </Text>
          <Text style={styles.uploadHint}>Supports JPG, PNG up to 10MB</Text>
        </TouchableOpacity>

        <View style={styles.confidenceCard}>
          <Text style={styles.confidenceLabel}>SCAN CONFIDENCE</Text>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidencePercent}>{confidence.percent}%</Text>
            <Text style={styles.confidenceWord}>{confidence.label}</Text>
            {confidence.needsMore > 0 ? (
              <TouchableOpacity onPress={handlePick} disabled={!canAddMore}>
                <Text style={styles.confidenceCta}>
                  + Add {confidence.needsMore} more photo{confidence.needsMore === 1 ? '' : 's'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.confidenceReadyTag}>
                <Icon name="check" size={12} color={COLORS.brandGreen} />
                <Text style={styles.confidenceReadyText}>Ready</Text>
              </View>
            )}
          </View>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceBarFill,
                { width: `${confidence.percent}%` },
              ]}
            />
          </View>
        </View>

        {assets.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>CAPTURED ASSETS</Text>
            {assets.map(a => (
              <AssetRow key={a.id} asset={a} onRemove={() => handleRemove(a.id)} />
            ))}
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.runBtn, !canRunScan && styles.runBtnDisabled]}
          onPress={handleRunScan}
          disabled={!canRunScan}>
          <Icon name="creation" size={18} color={COLORS.white} />
          <Text style={styles.runBtnText}>Run AI scan</Text>
        </TouchableOpacity>

        {assets.length > 0 && assets.length < MIN_IMAGES ? (
          <Text style={styles.minHint}>
            Add at least {MIN_IMAGES - assets.length} more photo{MIN_IMAGES - assets.length === 1 ? '' : 's'} to run a scan.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const AssetRow = ({ asset, onRemove }) => {
  const display = qualityDisplay(asset.quality);
  const tone = QUALITY_TONE[display.tone];
  return (
    <View style={styles.assetCard}>
      <Image source={{ uri: asset.uri }} style={styles.assetThumb} />
      <View style={styles.assetMeta}>
        <View style={styles.assetTopRow}>
          <Text style={styles.assetName} numberOfLines={1}>{asset.fileName}</Text>
          <View style={[styles.qualityBadge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.qualityBadgeText, { color: tone.fg }]}>{display.label}</Text>
          </View>
        </View>
        <Text style={styles.assetSize}>{formatBytes(asset.fileSize)}</Text>
        <Text style={[styles.assetReason, { color: tone.fg }]}>
          {asset.quality === 'good' ? '✓ ' : asset.quality === 'poor' ? '! ' : '· '}
          {asset.qualityReason}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={styles.assetRemove}>
        <Icon name="trash-can-outline" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  headerBtn: { padding: SPACING.xs },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  aiPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.mintUnderline,
  },
  aiPillText: { color: COLORS.brandGreen, fontSize: 12, fontWeight: '700' },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  heroTitle: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  heroSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg, lineHeight: 20 },

  uploadZone: {
    backgroundColor: '#E8F4F1',
    borderRadius: 20,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.mintUnderline, borderStyle: 'dashed',
    marginBottom: SPACING.lg,
  },
  uploadZoneDisabled: { opacity: 0.5 },
  uploadIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  uploadHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  confidenceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  confidenceLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.7, marginBottom: SPACING.xs,
  },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  confidencePercent: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  confidenceWord: { fontSize: 14, color: COLORS.textSecondary, flex: 1 },
  confidenceCta: { fontSize: 13, fontWeight: '600', color: COLORS.brandGreen },
  confidenceReadyTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E1F4ED',
    paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 12,
  },
  confidenceReadyText: { color: COLORS.brandGreen, fontSize: 12, fontWeight: '700' },
  confidenceBar: { height: 6, borderRadius: 3, backgroundColor: COLORS.inputBackground, overflow: 'hidden' },
  confidenceBarFill: { height: 6, backgroundColor: COLORS.brandGreen },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 0.7, marginBottom: SPACING.sm,
  },

  assetCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  assetThumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: COLORS.inputBackground },
  assetMeta: { flex: 1 },
  assetTopRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  assetName: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  qualityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  qualityBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  assetSize: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  assetReason: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  assetRemove: { padding: SPACING.xs },

  runBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.brandGreen,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: SPACING.md,
  },
  runBtnDisabled: { opacity: 0.55 },
  runBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  minHint: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 12, marginTop: SPACING.sm },
});

export default MultiImageCaptureScreen;
