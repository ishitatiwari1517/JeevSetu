// ─── StatusChip ───────────────────────────────────────────────────────────────
// Coloured pill badge used consistently across all animal/task cards and detail screens.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../theme/colors';

export type ChipVariant =
  // Animal status
  | 'intake' | 'quarantine' | 'medical_hold' | 'available'
  | 'fostered' | 'adopted' | 'transferred' | 'deceased'
  // Health status
  | 'healthy' | 'stable' | 'needs_attention' | 'critical'
  // Generic
  | 'pending' | 'approved' | 'rejected' | 'completed';

const CHIP_CONFIG: Record<ChipVariant, { label: string; bg: string; text: string }> = {
  // Animal status
  intake:        { label: 'Intake',        bg: '#E8F4FD', text: '#1A5C7A' },
  quarantine:    { label: 'Quarantine',    bg: '#FEF3C7', text: '#92400E' },
  medical_hold:  { label: 'Medical Hold',  bg: COLORS.attentionBg, text: COLORS.attention },
  available:     { label: 'Available',     bg: COLORS.healthyBg,   text: COLORS.healthy },
  fostered:      { label: 'Fostered',      bg: '#EDE9FE', text: '#5B21B6' },
  adopted:       { label: 'Adopted',       bg: '#D1FAE5', text: '#065F46' },
  transferred:   { label: 'Transferred',   bg: COLORS.neutralBg,   text: COLORS.neutral },
  deceased:      { label: 'Deceased',      bg: '#F3F4F6', text: '#374151' },

  // Health status
  healthy:       { label: 'Healthy',       bg: COLORS.healthyBg,   text: COLORS.healthy },
  stable:        { label: 'Stable',        bg: '#EBF5FB', text: COLORS.brand },
  needs_attention:{ label: 'Attention',    bg: COLORS.attentionBg, text: COLORS.attention },
  critical:      { label: 'Critical',      bg: COLORS.criticalBg,  text: COLORS.critical },

  // Generic
  pending:       { label: 'Pending',       bg: '#FEF3C7', text: '#92400E' },
  approved:      { label: 'Approved',      bg: COLORS.healthyBg,   text: COLORS.healthy },
  rejected:      { label: 'Rejected',      bg: COLORS.criticalBg,  text: COLORS.critical },
  completed:     { label: 'Completed',     bg: '#D1FAE5', text: '#065F46' },
};

interface Props {
  variant: ChipVariant;
  size?: 'sm' | 'md';
  customLabel?: string;
}

const StatusChip: React.FC<Props> = ({ variant, size = 'md', customLabel }) => {
  const config = CHIP_CONFIG[variant] ?? { label: variant, bg: COLORS.neutralBg, text: COLORS.neutral };
  const isSmall = size === 'sm';

  return (
    <View style={[styles.chip, { backgroundColor: config.bg }, isSmall && styles.chipSm]}>
      <Text style={[styles.label, { color: config.text }, isSmall && styles.labelSm]}>
        {customLabel ?? config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  chipSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 10,
  },
});

export default StatusChip;
