import type { FieldErrors } from '@/hooks/useFormState';
import { getThemeColors } from '@/constants/brandThemes';
import type { BrandConfig, BrandConfigState } from '@/types/tractstack';

/**
 * Convert backend BrandConfig to local state format
 * Splits CSV strings into arrays for easier client-side manipulation
 * Provides safe defaults for undefined values to prevent controlled input warnings
 */
export function convertToLocalState(
  brandConfig: BrandConfig
): BrandConfigState {
  return {
    siteInit: brandConfig.SITE_INIT ?? false,
    wordmarkMode: brandConfig.WORDMARK_MODE ?? '',
    brandColours: brandConfig.BRAND_COLOURS
      ? brandConfig.BRAND_COLOURS.split(',').map((color) => color.trim())
      : getThemeColors('Default'), // Fallback to Default theme
    openDemo: brandConfig.OPEN_DEMO ?? false,
    homeSlug: brandConfig.HOME_SLUG ?? 'hello',
    tractstackHomeSlug: brandConfig.TRACTSTACK_HOME_SLUG ?? 'HELLO',
    theme: brandConfig.THEME ?? 'light-bold',
    socials: brandConfig.SOCIALS
      ? brandConfig.SOCIALS.split(',').filter((social) => social.trim())
      : [],
    logo: brandConfig.LOGO ?? '',
    wordmark: brandConfig.WORDMARK ?? '',
    og: brandConfig.OG ?? '',
    oglogo: brandConfig.OGLOGO ?? '',
    favicon: brandConfig.FAVICON ?? '',
    siteUrl: brandConfig.SITE_URL ?? '',
    slogan: brandConfig.SLOGAN ?? '',
    footer: brandConfig.FOOTER ?? '',
    ogtitle: brandConfig.OGTITLE ?? '',
    ogauthor: brandConfig.OGAUTHOR ?? '',
    ogdesc: brandConfig.OGDESC ?? '',
    gtag: brandConfig.GTAG ?? '',
    stylesVer: brandConfig.STYLES_VER ?? 1,
    knownResources: brandConfig.KNOWN_RESOURCES ?? {},
    hasAAI: brandConfig.HAS_AAI ?? false,
  };
}

/**
 * Convert local state back to backend BrandConfig format
 * Joins arrays back into CSV/pipe-separated strings
 */
export function convertToBackendFormat(
  localState: BrandConfigState
): BrandConfig {
  return {
    SITE_INIT: localState.siteInit,
    WORDMARK_MODE: localState.wordmarkMode,
    BRAND_COLOURS: localState.brandColours.join(','),
    OPEN_DEMO: localState.openDemo,
    STYLES_VER: localState.stylesVer,
    HOME_SLUG: localState.homeSlug,
    TRACTSTACK_HOME_SLUG: localState.tractstackHomeSlug,
    THEME: localState.theme,
    SOCIALS: localState.socials.join(','),
    SITE_URL: localState.siteUrl,
    SLOGAN: localState.slogan,
    FOOTER: localState.footer,
    OGTITLE: localState.ogtitle,
    OGAUTHOR: localState.ogauthor,
    OGDESC: localState.ogdesc,
    GTAG: localState.gtag,
    KNOWN_RESOURCES: localState.knownResources,
    HAS_AAI: localState.hasAAI,

    // ALWAYS send asset paths (current state)
    LOGO: localState.logo,
    WORDMARK: localState.wordmark,
    OG: localState.og,
    OGLOGO: localState.oglogo,
    FAVICON: localState.favicon,

    // Only send base64 when uploading
    LOGO_BASE64: localState.logoBase64,
    WORDMARK_BASE64: localState.wordmarkBase64,
    OG_BASE64: localState.ogBase64,
    OGLOGO_BASE64: localState.oglogoBase64,
    FAVICON_BASE64: localState.faviconBase64,
  };
}

/**
 * Validation function for brand configuration
 * Returns field-level error messages
 */
export function validateBrandConfig(state: BrandConfigState): FieldErrors {
  const errors: FieldErrors = {};

  // Validate required fields
  if (!state.siteUrl?.trim()) {
    errors.siteUrl = 'Site URL is required';
  } else if (!isValidUrl(state.siteUrl)) {
    errors.siteUrl = 'Please enter a valid URL';
  }

  if (!state.slogan?.trim()) {
    errors.slogan = 'Site slogan is required';
  }
  if (!state.footer?.trim()) {
    errors.footer = 'Site footer is required';
  }

  // Validate brand colors (must have exactly 8)
  if (!state.brandColours || state.brandColours.length !== 8) {
    errors.brandColours = 'Must have exactly 8 brand colors';
  } else {
    // Validate each color is a valid hex
    const invalidColors = state.brandColours.filter(
      (color) => !isValidHexColor(color)
    );
    if (invalidColors.length > 0) {
      errors.brandColours = `Invalid hex colors: ${invalidColors.join(', ')}`;
    }
  }

  // Validate social links format
  if (state.socials && state.socials.length > 0) {
    const invalidSocials = state.socials.filter((social) => {
      const parts = social.split('|');
      return parts.length !== 2 || !parts[0].trim() || !isValidUrl(parts[1]);
    });

    if (invalidSocials.length > 0) {
      errors.socials = 'Social links must be in format "platform|url"';
    }
  }

  return errors;
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to validate hex colors
 * Accepts both 3 and 6 character hex codes (with or without #)
 */
function isValidHexColor(color: string): boolean {
  const hex = color.startsWith('#') ? color.slice(1) : color;
  return /^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}
