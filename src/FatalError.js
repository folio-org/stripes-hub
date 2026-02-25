import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Button, Col, OrganizationLogo, Row, Select } from './StripesComponents';
import { getLoginUrl, getCurrentTenant } from './loginServices';
import styles from './index.css';


function FatalError({ branding, config, error }) {
  const intl = useIntl();
  const [message, setMessage] = useState();
  const [subMessage, setSubMessage] = useState();

  const handleLogout = async () => {
    await fetch(`${config.gatewayUrl}/logout`, {
      method: 'POST',
      credentials: 'include',
    }); // eslint-disable-line no-unused-vars
    globalThis.location.assign(location.origin);
  }

  const handleReload = () => {
    location.reload();
  }

  useEffect(() => {
    if (error?.options?.json) {
      if (error?.options.json?.errors[0]?.message) {
        setMessage(error.options.json?.errors[0]?.message);
        const params = error.options.json.errors[0]?.parameters;
        if (params && params[0]?.value) {
          setSubMessage(params[0].value);
        }
      }
    }
  }, [error]);

  return (
    <main style={{ width: '100%' }}>
      <div>
        <div className={styles.container}>
          <Row center="xs">
            <Col xs={12}>
              <OrganizationLogo branding={branding} />
            </Col>
          </Row>
          <Row center="xs">
            <Col xs={12}>
              <h1>Rats. You successfully signed in, but FOLIO failed to load because of an error 😢</h1>
              <h2>{error.message}</h2>
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
                Try again
              </Button>
            </Col>
            <Col xs={6}>
              <Button
                className={styles.submitButton}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    </main>
  );
}

FatalError.propTypes = {
  branding: PropTypes.shape({
    logo: PropTypes.string,
    altText: PropTypes.string,
  }).isRequired,
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
    cause: PropTypes.shape({ message: PropTypes.string.isRequired }),
  }).isRequired
};

export default FatalError;
