// Public API of the access feature. Other features import ONLY from here.
export { AdultGate, type AdultGateProps } from './ui/AdultGate';
export { ConsentBanner, type ConsentBannerProps } from './ui/ConsentBanner';
export { RoleBadge, type Role, type RoleBadgeProps } from './ui/RoleBadge';
export { SignIn, type SignInProps } from './ui/SignIn';
export { PinEntry, type PinEntryProps } from './ui/PinEntry';
export { PinConfirm, type PinConfirmProps } from './ui/PinConfirm';
export { LearnerPreferences } from './ui/LearnerPreferences';
export { LearnerProfileScreen } from './ui/LearnerProfileScreen';
export { PrivacyConsentScreen } from './ui/PrivacyConsentScreen';
export { RolesPermissionsScreen } from './ui/RolesPermissionsScreen';
export {
  canView,
  loadPermissions,
  savePermission,
  DEFAULT_PERMISSIONS,
  ROLES,
  type PermissionMap,
  type RolePermission,
  type Resource,
} from './domain/permissions';
export { createPinService, isValidPin, type PinService, type VerifyResult } from './domain/pin';
export { createAuthStore, INACTIVITY_MS, type AuthState } from './domain/authStore';
export { getPinService } from './data/pinStore';
export {
  createLearner,
  getLearner,
  updateLearner,
  getConsent,
  saveConsent,
  withdrawFromResearch,
  deleteAllRecords,
  deleteRecordsOlderThan,
  type Learner,
  type Consent,
} from './data/learnerRepo';
export { RequireRole, useCanView } from './ui/RequireRole';
