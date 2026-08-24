import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING } from '../theme/colors';
import {
  STEPS, STEP_DURATION_MS, computeStep, stepIndex, progressFraction, isSlowConnection,
} from './scanProgress';
import { runMultiImageScan, ScanError } from '../services/aiScan';
import { recordScan } from '../services/scanHistoryService';
import { listPets } from '../services/petService';

const TICK_MS = 100;

const ScanProcessingScreen = ({ navigation, route }) => {
  const { assets } = route?.params ?? { assets: [] };
  const startedAtRef = useRef(Date.now());
  const scanResultRef = useRef(null);

  const [elapsed, setElapsed] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Run the scan once on mount.
  useEffect(() => {
    let cancelled = false;
    runMultiImageScan(assets)
      .then(result => {
        if (cancelled) return;
        scanResultRef.current = result;
        setScanComplete(true);
      })
      .catch(err => {
        if (cancelled) return;
        const message = err instanceof ScanError ? err.message : 'Scan failed. Try again.';
        setScanError(message);
      });
    return () => { cancelled = true; };
  }, [assets]);

  // Drive the elapsed-time clock.
  useEffect(() => {
    if (scanError) return undefined;
    const id = setInterval(() => {
      setElapsed(Date.now() - startedAtRef.current);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [scanError]);

  const currentStep = computeStep(elapsed, scanComplete);
  const slow = isSlowConnection(elapsed, currentStep);
  const stepObj = STEPS.find(s => s.key === currentStep) ?? STEPS[0];

  // Once we've reached `finalize` AND held it for one window, persist + transition.
  useEffect(() => {
    if (!scanComplete || !scanResultRef.current) return undefined;
    const id = setTimeout(async () => {
      const result = scanResultRef.current;
      const heroUri = assets[0]?.uri;
      // Best-effort persist. A storage failure should not block the user from
      // seeing the result they just paid wait time for.
      try {
        const pets = await listPets();
        await recordScan({
          result,
          heroUri,
          imageCount: assets.length,
          petId: pets[0]?.id,
        });
      } catch (e) {
        console.warn('[scanHistory] failed to persist scan:', e?.message);
      }
      navigation.replace('ScanResult', {
        result,
        heroUri,
        imageCount: assets.length,
        totalImageCount: assets.length,
      });
    }, STEP_DURATION_MS);
    return () => clearTimeout(id);
  }, [scanComplete, assets, navigation]);

  if (scanError) {
    return (
      <ErrorState
        message={scanError}
        onRetry={() => {
          startedAtRef.current = Date.now();
          setElapsed(0);
          setScanComplete(false);
          setScanError(null);
          scanResultRef.current = null;
          runMultiImageScan(assets)
            .then(result => { scanResultRef.current = result; setScanComplete(true); })
            .catch(err => {
              const m = err instanceof ScanError ? err.message : 'Scan failed. Try again.';
              setScanError(m);
            });
        }}
        onCancel={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.body}>
        <Text style={styles.heroTitle}>Processing your scan</Text>
        <Text style={styles.heroSubtitle}>This usually takes 5–15 seconds.</Text>

        <View style={styles.stepsRow}>
          {STEPS.map((s, i) => (
            <StepDot
              key={s.key}
              index={i}
              short={s.short}
              currentIndex={stepIndex(currentStep)}
            />
          ))}
        </View>

        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.round(progressFraction(currentStep) * 100)}%` },
            ]}
          />
        </View>

        {assets[0]?.uri ? (
          <Image source={{ uri: assets[0].uri }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Icon name="paw" size={42} color={COLORS.textSecondary} />
          </View>
        )}

        <Text style={styles.activeLabel}>{stepObj.label}</Text>

        {slow ? (
          <View style={styles.slowBanner}>
            <Icon name="wifi-strength-1-alert" size={18} color="#A77410" />
            <Text style={styles.slowText}>
              Slow connection — your scan is still running. You can stay on this
              screen or come back later.
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const StepDot = ({ index, short, currentIndex }) => {
  const completed = index < currentIndex;
  const active = index === currentIndex;
  return (
    <View style={styles.stepCol}>
      <View
        style={[
          styles.stepDot,
          completed && styles.stepDotDone,
          active && styles.stepDotActive,
        ]}>
        {completed ? (
          <Icon name="check" size={14} color={COLORS.white} />
        ) : (
          <Text style={[styles.stepDotNum, active && styles.stepDotNumActive]}>{index + 1}</Text>
        )}
      </View>
      <Text
        style={[
          styles.stepLabel,
          (completed || active) && styles.stepLabelActive,
        ]}>
        {short}
      </Text>
    </View>
  );
};

const ErrorState = ({ message, onRetry, onCancel }) => (
  <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
    <View style={styles.errorBody}>
      <View style={styles.errorIconWrap}>
        <Icon name="alert-circle-outline" size={48} color="#B53636" />
      </View>
      <Text style={styles.errorTitle}>Scan didn't go through</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Icon name="refresh" size={16} color={COLORS.white} />
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.errorCancel} onPress={onCancel}>
        <Text style={styles.errorCancelText}>Back to capture</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  body: { flex: 1, padding: SPACING.lg, alignItems: 'center', justifyContent: 'center' },

  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  heroSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl },

  stepsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: SPACING.sm,
  },
  stepCol: { flex: 1, alignItems: 'center' },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 2, borderColor: COLORS.inputBackground,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { borderColor: COLORS.brandGreen },
  stepDotDone: { backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen },
  stepDotNum: { color: COLORS.textSecondary, fontWeight: '700' },
  stepDotNumActive: { color: COLORS.brandGreen },
  stepLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6 },
  stepLabelActive: { color: COLORS.brandGreen, fontWeight: '700' },

  barTrack: {
    width: '100%', height: 4, borderRadius: 2,
    backgroundColor: COLORS.inputBackground,
    marginBottom: SPACING.lg, overflow: 'hidden',
  },
  barFill: { height: 4, backgroundColor: COLORS.brandGreen },

  heroImage: {
    width: 140, height: 140, borderRadius: 24,
    backgroundColor: COLORS.inputBackground,
    marginBottom: SPACING.lg,
  },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  activeLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },

  slowBanner: {
    flexDirection: 'row', gap: SPACING.sm,
    backgroundColor: '#FFF3D6',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    alignItems: 'flex-start',
  },
  slowText: { flex: 1, fontSize: 12, color: '#A77410', lineHeight: 17 },

  cancel: { alignItems: 'center', paddingVertical: SPACING.lg },
  cancelText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },

  errorBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  errorIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FCE7E7',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  errorMessage: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', marginVertical: SPACING.md,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.brandGreen,
    paddingHorizontal: SPACING.xl, paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  errorCancel: { marginTop: SPACING.md, paddingVertical: 8 },
  errorCancelText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
});

export default ScanProcessingScreen;
