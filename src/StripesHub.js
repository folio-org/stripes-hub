import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import useInitSession from './hooks/useInitSession';
import { sharedMessages } from './constants/sharedMessages';
import { urlPaths } from './constants';
import FatalError from './FatalError';
import { Col, Row } from './StripesComponents';
import StripesTemplate from './StripesTemplate';

function StripesHub({ branding, config }) {
  const {
    isLoadingDiscovery,
    discoveryError,
    isLoadingEntitlement,
    entitlementError,
    isLoadingStripes,
    stripesError,
    isLoadingSession,
    sessionError,
  } = useInitSession(config, branding, urlPaths.AUTHN_LOGIN);

  const error = discoveryError || entitlementError || stripesError || sessionError;

  if (error) {
    return <FatalError branding={branding} config={config} error={error} />;
  }

  return (
    <StripesTemplate branding={branding}>
      <Row center="xs">
        <Col xs={12}>
          <div data-testid="StripesHub">
            {isLoadingEntitlement && <h1><FormattedMessage {...sharedMessages.loadingEntitlements} /></h1>}
            {isLoadingDiscovery && <h1><FormattedMessage {...sharedMessages.loadingDiscovery} /></h1>}
            {isLoadingSession && <h1><FormattedMessage {...sharedMessages.loadingSession} /></h1>}
            {isLoadingStripes && <h1><FormattedMessage {...sharedMessages.loadingStripes} /></h1>}
          </div>
        </Col>
      </Row>
    </StripesTemplate>
  );
}

StripesHub.propTypes = {
  config: PropTypes.shape({
    gatewayUrl: PropTypes.string.isRequired,
    authnUrl: PropTypes.string.isRequired,
    discoveryUrl: PropTypes.string,
    tenantOptions: PropTypes.object.isRequired,
    preserveConsole: PropTypes.bool,
  }).isRequired,
  branding: PropTypes.shape({
    logo: PropTypes.shape({
      src: PropTypes.string,
      alt: PropTypes.string,
    }),
    favicon: PropTypes.shape({
      src: PropTypes.string,
    }),
  }).isRequired,
};

export default StripesHub;
