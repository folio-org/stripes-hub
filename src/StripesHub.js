import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'react-intl';

import useInitSession from './hooks/useInitSession';
import { urlPaths } from './constants';
import FatalError from './FatalError';

function StripesHub({ config, branding }) {
  const intl = useIntl();

  const { error, isLoading } = useInitSession(config, branding, urlPaths.AUTHN_LOGIN);

  if (error) {
    return <FatalError branding={branding} config={config} error={error} />;
  }

  return (
    <div data-testid="StripesHub">
      {isLoading && <h1><FormattedMessage id="stripes-hub.StripesHub.initializingSession" /></h1>}
    </div>
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
    logo: PropTypes.string,
    altText: PropTypes.string,
  }).isRequired,
};

export default StripesHub;
