import { defineMessages } from 'react-intl';

export const sharedMessages = defineMessages({
  errorEntitlementFetch: {
    id: 'stripes-hub.error.entitlementFetch',
    defaultMessage: 'Entitlement fetch error at {url}',
  },
  errorDiscoveryFetch: {
    id: 'stripes-hub.error.discoveryFetch',
    defaultMessage: 'Discovery fetch error at {url}',
  },
  errorSessionFetch: {
    id: 'stripes-hub.error.sessionFetch',
    defaultMessage: 'Session fetch error at {url}',
  },
  errorTokenExchangeFailure: {
    id: 'stripes-hub.error.tokenExchangeFailure',
    defaultMessage: 'Token exchange failed',
  },
  errorStripesFetchFailure: {
    id: 'stripes-hub.error.stripesFetchFailure',
    defaultMessage: 'Stripes fetch error at {url}',
  },
  oidcOtpMissingCode: {
    id: 'stripes-hub.oidc.otp.missingCode',
    defaultMessage: 'Missing code in the URL',
  },
  fatalErrorHeadline: {
    id: 'stripes-hub.FatalError.headline',
    defaultMessage: 'Oh, snap. You successfully signed in, but FOLIO failed to load because of an error 😢. If the problem persists please contact your system administrator.',
  },
  fatalErrorTryAgain: {
    id: 'stripes-hub.FatalError.tryAgain',
    defaultMessage: 'Try again',
  },
  fatalErrorLogout: {
    id: 'stripes-hub.FatalError.logout',
    defaultMessage: 'Logout',
  },
  initializingSession: {
    id: 'stripes-hub.OidcLanding.initializingSession',
    defaultMessage: 'Initializing session...',
  },
  validatingAuthenticationToken: {
    id: 'stripes-hub.OidcLanding.validatingAuthenticationToken',
    defaultMessage: 'Validating authentication token...',
  },
  tenantLibrary: {
    id: 'stripes-hub.PreLoginLanding.tenantLibrary',
    defaultMessage: 'Tenant / Library',
  },
  tenantChoose: {
    id: 'stripes-hub.PreLoginLanding.tenantChoose',
    defaultMessage: 'Choose your tenant',
  },
  continueButton: {
    id: 'stripes-hub.PreLoginLanding.button.continue',
    defaultMessage: 'Continue',
  },
  loadingEntitlements: {
    id: 'stripes-hub.StripesHub.loadingEntitlements',
    defaultMessage: 'Loading entitlements ...',
  },
  loadingDiscovery: {
    id: 'stripes-hub.StripesHub.loadingDiscovery',
    defaultMessage: 'Loading discovery ...',
  },
  loadingSession: {
    id: 'stripes-hub.StripesHub.loadingSession',
    defaultMessage: 'Loading session ...',
  },
  loadingStripes: {
    id: 'stripes-hub.StripesHub.loadingStripes',
    defaultMessage: 'Loading Stripes ...',
  },
});
