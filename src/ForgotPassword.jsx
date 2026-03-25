import { Field, Form } from 'react-final-form';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import StripesTemplate from './StripesTemplate';
import ForgotDidMutate from './ForgotDidMutate';
import { getLoginTenant } from './loginServices';
import useForgotPassword from './hooks/useForgotPassword';
import {
  Button, Col, FieldLabel, Headline, Row, TextField
} from './StripesComponents'
import { brandingShape, configShape } from './constants';
import styles from './index.module.css';

const ForgotPassword = ({ branding, config }) => {
  const intl = useIntl();
  const { name: tenant } = getLoginTenant(config);

  const { handleSubmit, didMutate } = useForgotPassword({ config, tenant });
  const forgotPasswordPlaceholder = intl.formatMessage({ id: 'stripes-hub.ForgotPassword.placeholder' });

  if (didMutate) {
    history.pushState({}, "", "/check-email");
    return <ForgotDidMutate branding={branding} />;
  }

  return (
    <StripesTemplate branding={branding}>
      <Form
        onSubmit={handleSubmit}
        render={({ handleSubmit, pristine }) => (
          <form
            className={styles.hubForm}
            data-form="forgot"
            onSubmit={handleSubmit}
          >
            <Row center="xs">
              <Col xs={6}>
                <Headline
                  size="xx-large"
                  tag="h1"
                  data-test-h1
                >
                  <FormattedMessage id="stripes-hub.ForgotPassword.title" />
                </Headline>
              </Col>
            </Row>
            <div data-test-new-username-field>
              <Row center="xs">
                <Col xs={6}>
                  <Row
                    between="xs"
                    bottom="xs"
                  >
                    <Col xs={8}>
                      <FieldLabel htmlFor="input-email-or-phone">
                        {forgotPasswordPlaceholder}
                      </FieldLabel>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row center="xs">
                <Col xs={6}>
                  <Field
                    id="input-email-or-phone"
                    component={TextField}
                    name="userInput"
                    type="text"
                    inputClass={styles.hubInput}
                    validationEnabled={false}
                    hasClearIcon={false}
                    autoCapitalize="none"
                    required
                    value=""
                    placeholder={forgotPasswordPlaceholder}
                  />
                </Col>
              </Row>
            </div>
            <Row center="xs">
              <Col xs={6}>
                <div className={styles.formGroup}>
                  <Button
                    id="clickable-login"
                    type="submit"
                    disabled={pristine || !tenant}
                    className={styles.hubButton}
                  >
                    <FormattedMessage id="stripes-hub.button.continue" />
                  </Button>
                </div>
              </Col>
            </Row>
          </form>
        )}
      />
    </StripesTemplate>
  );
};

ForgotPassword.propTypes = {
  branding: PropTypes.shape(brandingShape).isRequired,
  config: PropTypes.shape(configShape).isRequired,
}

export default ForgotPassword;
