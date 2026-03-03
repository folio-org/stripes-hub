import { useIntl, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { Button, Col, Row } from './StripesComponents';
import StripesTemplate from './StripesTemplate';
import styles from './index.css';

function FatalError({ branding, config, error }) {
  const intl = useIntl();

  console.error({ error })
  const handleLogout = async () => {
    await fetch(`${config.gatewayUrl}/logout`, {
      method: 'POST',
      credentials: 'include',
    }); 
    globalThis.location.assign(location.origin);
  }

  const handleReload = () => {
    location.reload();
  }

  // did we get some juicy json in an API response?
  let message = null;
  let subMessage = null;
  if (error?.options?.json?.errors?.[0]?.message) {
    message = error?.options?.json?.errors[0]?.message;
    subMessage = error?.options?.json?.errors[0]?.parameters?.[0].value;
  } else if (error?.options?.json?.message) {
    message = error?.options?.json?.message;
  }

  const l10nMessage = error.options?.id ? intl.formatMessage({ id: error.options.id }, { url: error?.options?.url }) : error.message;

  return (
    <StripesTemplate branding={branding}>
      <Row center="xs">
        <Col xs={12}>
          <h1><FormattedMessage id="stripes-hub.FatalError.headline" /></h1>
          <h2>{l10nMessage}</h2>
          <h3>{message}</h3>
          <h3>{subMessage}</h3>
        </Col>
      </Row>
      <Row center="xs">
        <Col xs={6}>
          <Button
            className={styles.submitButton}
            onClick={handleReload}
          >
            <FormattedMessage id="stripes-hub.FatalError.tryAgain" />
          </Button>
        </Col>
        <Col xs={6}>
          <Button
            className={styles.submitButton}
            onClick={handleLogout}
          >
            <FormattedMessage id="stripes-hub.FatalError.logout" />
          </Button>
        </Col>
      </Row>
    </StripesTemplate>

  );
}

FatalError.propTypes = {
  branding: PropTypes.shape({
    altText: PropTypes.string,
    logo: PropTypes.string,
  }).isRequired,
  config: PropTypes.shape({
    gatewayUrl: PropTypes.string.isRequired,
  }).isRequired,
  error: PropTypes.shape({
    cause: PropTypes.shape({ message: PropTypes.string.isRequired }),
    message: PropTypes.string.isRequired,
    options: PropTypes.shape({
      id: PropTypes.string,
      json: PropTypes.shape({
        message: PropTypes.string,
        errors: PropTypes.arrayOf(PropTypes.shape({
          message: PropTypes.string,
          parameters: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.string,
          })),
        })),
      }),
      url: PropTypes.string,
    }),
  }).isRequired
};

export default FatalError;
