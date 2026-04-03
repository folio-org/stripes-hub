import React from 'react';
import { FormattedMessage } from 'react-intl';
//import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';

import {
  Button,
  Headline,
  OrganizationLogo
} from '../../StripesComponents';

import styles from './PasswordSuccessfullyChanged.module.css';

const PasswordSuccessfullyChanged = ({ history, config, branding }) => {
  const labelNamespace = 'stripes-hub.label';
  const buttonNamespace = 'stripes-hub.button';

  const handleRedirectClick = () => {
    // Go to base URL.
    history.pushState({}, '', '/');
  };

  return (
    <div
      className={styles.wrap}
      data-test-change-password-confirmation
    >
      <div className={styles.centered}>
        <OrganizationLogo branding={branding} />
        <Headline
          size="xx-large"
          tag="h1"
          data-test-h1
        >
          <FormattedMessage id={`${labelNamespace}.congratulations`} />
        </Headline>
        <Headline
          size="x-large"
          tag="p"
          weight="regular"
          faded
          data-test-message
        >
          <FormattedMessage id={`${labelNamespace}.changed.password`} />
        </Headline>
        <div data-test-redirect>
          <Button
            buttonClass={styles.submitButton}
            buttonStyle="primary"
            fullWidth
            marginBottom0
            data-test-redirect
            onClick={handleRedirectClick}
          >
            <FormattedMessage id={`${buttonNamespace}.redirect.login`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

PasswordSuccessfullyChanged.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  stripes: PropTypes.object,
};

export default PasswordSuccessfullyChanged;
