// ─── PetVue Design System ────────────────────────────────────────────────────
// Brand color sourced directly from the PetVue logo (teal-blue shield)

export const COLORS = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  brand:          '#2B7A9E',   // Primary teal — logo color
  brandDark:      '#1A5C7A',   // Darker teal — pressed states, headers
  brandLight:     '#EBF5FB',   // Tinted surface — selected states, badges
  brandMuted:     '#D6EAF8',   // Very light teal — background accents

  // ── Status ─────────────────────────────────────────────────────────────────
  healthy:        '#1E8449',
  healthyBg:      '#EAFAF1',
  attention:      '#B7770D',
  attentionBg:    '#FEF9E7',
  critical:       '#922B21',
  criticalBg:     '#FDEDEC',
  neutral:        '#5D6D7E',
  neutralBg:      '#F2F3F4',

  // ── Surfaces ───────────────────────────────────────────────────────────────
  background:     '#F4F6F8',   // App background
  surface:        '#FFFFFF',   // Card surface
  surfaceSecondary:'#F8FAFC',  // Subtle secondary surface
  border:         '#E2E8F0',
  borderLight:    '#EDF2F7',

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:    '#1A202C',
  textSecondary:  '#718096',
  textMuted:      '#A0AEC0',
  textOnBrand:    '#FFFFFF',

  // ── Functional ─────────────────────────────────────────────────────────────
  white:          '#FFFFFF',
  black:          '#000000',
  error:          '#E53E3E',
  errorBg:        '#FFF5F5',
  success:        '#38A169',
  successBg:      '#F0FFF4',
  warning:        '#D69E2E',
  warningBg:      '#FFFFF0',

  // ── Legacy aliases (keep so old screens don't break during migration) ───────
  brandGreen:     '#2B7A9E',   // mapped to brand
  primaryBlue:    '#2B7A9E',
  inputBackground:'#F4F6F8',
  placeholder:    '#A0AEC0',
  forgotText:     '#2B7A9E',
  mintUnderline:  '#D6EAF8',
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const RADIUS = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  heavy: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const STYLES = {
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    marginHorizontal: 4,
    ...SHADOW.card,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
};

