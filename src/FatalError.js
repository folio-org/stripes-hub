import React, { useEffect, useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { Button, Col, OrganizationLogo, Row, Select } from './StripesComponents';
import Template from './Template';
import styles from './index.css';


function FatalError({ branding, config, error }) {
  const intl = useIntl();

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

  let message = null;
  let subMessage = null;
  const errors = error?.options?.json?.errors;
  if (errors && errors[0]?.message) {
    setMessage(errors[0]?.message);
    const params = errors[0]?.parameters;
    if (params && params[0]?.value) {
      setSubMessage(params[0].value);
    }
  }

  return (
    <Template branding={branding}>
      <Row center="xs">
        <Col xs={12}>
          <h1><FormattedMessage id="stripes-hub.FatalError.headline" /></h1>
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
    </Template>

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
