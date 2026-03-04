import { Field, Form } from 'react-final-form';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import {
  AuthErrorsContainer, Button, Col, FieldLabel, Headline, Row,
  SelectAndDispatchTenant, TextField,
} from './StripesComponents'
import useForgotUsername from './hooks/useForgotUsername';
import { getLoginTenant, hideEmail } from './loginServices';
import StripesTemplate from './StripesTemplate';
import { brandingShape, configShape } from './constants';

const ForgotUsername = ({ branding, config }) => {
  const { name: tenant } = getLoginTenant(config);
  const { errors, handleSubmit, userEmail } = useForgotUsername({ config, tenant });

  const styles = {};
  const intl = useIntl();
  const forgotUsernamePlaceholder = intl.formatMessage({ id: 'stripes-hub.ForgotUsername.placeholder' });

  if (userEmail) {
    history.pushState({}, "", "/check-email");
    return (
      <StripesTemplate branding={branding}>
        <h1>Check your email</h1>
        <h2>An email has been sent to {hideEmail(userEmail)}</h2>
        <h2>If you do not receive the email, check your spam, junk, social or other folders. Or contact your FOLIO system administrator.</h2>
      </StripesTemplate>
    );
  }

  return (
    <StripesTemplate branding={branding}>
      <Form
        onSubmit={handleSubmit}
        render={({ handleSubmit, pristine }) => (
          <form
            className={styles.form}
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
                  <FormattedMessage id="stripes-hub.ForgotUsername.title" />
                </Headline>
              </Col>
            </Row>
            <SelectAndDispatchTenant styles={styles} />
            <div data-test-new-username-field>
              <Row center="xs">
                <Col xs={6}>
                  <Row
                    between="xs"
                    bottom="xs"
                  >
                    <Col xs={6}>
                      <FieldLabel htmlFor="input-email-or-phone">
                        {forgotUsernamePlaceholder}
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
                    marginBottom0
                    fullWidth
                    inputClass={styles.loginInput}
                    validationEnabled={false}
                    hasClearIcon={false}
                    autoCapitalize="none"
                    required
                    value=""
                    placeholder={forgotUsernamePlaceholder}
                  />
                </Col>
              </Row>
            </div>
            <Row center="xs">
              <Col xs={6}>
                <div className={styles.formGroup}>
                  <Button
                    buttonStyle="primary"
                    id="clickable-login"
                    type="submit"
                    disabled={pristine || !tenant}
                  >
                    <FormattedMessage id="stripes-hub.button.continue" />
                  </Button>
                </div>
              </Col>
            </Row>
            <Row center="xs">
              <Col xs={6}>
                <div className={styles.authErrorsWrapper}>
                  <AuthErrorsContainer
                    errors={errors}
                    data-test-container
                  />
                </div>
              </Col>
            </Row>
          </form>
        )}
      />
    </StripesTemplate>
  );
};

ForgotUsername.propTypes = {
  branding: PropTypes.shape(brandingShape).isRequired,
  config: PropTypes.shape(configShape).isRequired,
}

export default ForgotUsername;
