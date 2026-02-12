import PropTypes from 'prop-types';

import useInitSession from './hooks/useInitSession';
import { urlPaths } from './constants';

function StripesHub({ config, branding }) {
  const { isLoading } = useInitSession(config, branding, urlPaths.AUTHN_LOGIN);

  return (
    <div data-testid="StripesHub">
      {isLoading && <h1>Initializing session...</h1>}
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
