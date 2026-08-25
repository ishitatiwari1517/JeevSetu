// ─── QRScannerScreen ──────────────────────────────────────────────────────────
// Scans a PetVue QR code (petvue://animal/{animalId}) and navigates
// directly to that animal's adoption profile.

import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'react-native-camera-kit';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS } from '../theme/colors';

const QRScannerScreen = ({ navigation }) => {
  const [scanned, setScanned] = useState(false);

  const handleQRRead = ({ nativeEvent }) => {
    if (scanned) return;
    const value = nativeEvent?.codeStringValue;
    if (!value) return;

    setScanned(true); // prevent duplicate fires

    // Expected format: petvue://animal/{animalId}
    const match = value.match(/^petvue:\/\/animal\/(.+)$/);
    if (match) {
      const animalId = match[1];
      navigation.replace('AnimalAdoptionProfile', { animalId });
    } else {
      Alert.alert(
        'Not a PetVue QR',
        'This QR code is not from PetVue. Please scan an animal kennel card.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }],
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Animal QR</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera */}
      <View style={styles.cameraWrap}>
        <Camera
          style={StyleSheet.absoluteFill}
          scanBarcode
          onReadCode={handleQRRead}
          showFrame
          laserColor={COLORS.brand}
          frameColor={COLORS.white}
        />

        {/* Overlay instructions */}
        <View style={styles.overlay}>
          <View style={styles.scanWindow} />
        </View>

        <View style={styles.hint}>
          <Icon name="qrcode-scan" size={20} color={COLORS.white} />
          <Text style={styles.hintText}>
            Point at an animal's kennel QR card
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: '#000',
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },

  cameraWrap: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  scanWindow: {
    width: 240, height: 240,
    borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: COLORS.white,
    backgroundColor: 'transparent',
  },

  hint: {
    position: 'absolute', bottom: 60,
    alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  hintText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
});

export default QRScannerScreen;
