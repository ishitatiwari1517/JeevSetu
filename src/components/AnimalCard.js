// ─── AnimalCard ───────────────────────────────────────────────────────────────
// Reusable card used in the animal roster list.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, RADIUS, SHADOW } from '../theme/colors';
import StatusChip from './StatusChip';

// Species icon mapping
const SPECIES_ICON = {
  dog:     'dog',
  cat:     'cat',
  cow:     'cow',
  buffalo: 'cow',
  bird:    'bird',
  rabbit:  'rabbit',
  horse:   'horse-variant',
  other:   'paw',
};

// Health dot color
const HEALTH_DOT = {
  critical:        COLORS.critical,
  needs_attention: COLORS.attention,
  stable:          COLORS.brand,
  healthy:         COLORS.healthy,
};

const AnimalCard = ({ animal, onPress }) => {
  const icon = SPECIES_ICON[animal.species] || 'paw';
  const dotColor = HEALTH_DOT[animal.healthStatus] || COLORS.neutral;
  const displayName = animal.name || 'Unknown';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Photo / Species Icon */}
      <View style={styles.photoContainer}>
        {animal.photoUrl ? (
          <Image source={{ uri: animal.photoUrl }} style={styles.photo} />
        ) : animal.primaryPhotoUri ? (
          <Image source={{ uri: animal.primaryPhotoUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: COLORS.brandLight }]}>
            <Icon name={icon} size={28} color={COLORS.brand} />
          </View>
        )}
        {/* Health dot */}
        <View style={[styles.healthDot, { backgroundColor: dotColor }]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.caseId}>{animal.caseId}</Text>
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {animal.species.charAt(0).toUpperCase() + animal.species.slice(1)}
          {animal.breed ? `  ·  ${animal.breed}` : ''}
          {animal.estimatedAge ? `  ·  ${animal.estimatedAge}` : ''}
        </Text>
        <View style={styles.chipRow}>
          <StatusChip variant={animal.status} size="sm" />
          {(animal.healthStatus === 'critical' || animal.healthStatus === 'needs_attention') && (
            <View style={{ marginLeft: 6 }}>
              <StatusChip variant={animal.healthStatus} size="sm" />
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <Icon name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.card,
  },
  photoContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  caseId: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});

export default AnimalCard;
