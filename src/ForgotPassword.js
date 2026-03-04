import { Field, Form } from 'react-final-form';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import StripesTemplate from './StripesTemplate';
import { getLoginTenant, hideEmail } from './loginServices';
import useForgotPassword from './hooks/useForgotPassword';
import {
  SelectAndDispatchTenant, FieldLabel, Headline, Row, Col,
  TextField, Button, AuthErrorsContainer
} from './StripesComponents'
import { brandingShape, configShape } from './constants';


const ForgotPassword = ({ branding, config }) => {
  const intl = useIntl();
  const styles = {};
  const { name: tenant } = getLoginTenant(config);

  const { errors, handleSubmit, userEmail } = useForgotPassword({ config, tenant });
  const forgotPasswordPlaceholder = intl.formatMessage({ id: 'stripes-hub.ForgotPassword.placeholder' });

  if (userEmail) {
    history.pushState({}, "", "/check-email");

    return (
      <StripesTemplate branding={branding}>
        <p>An email has been sent to {hideEmail(userEmail)}</p>
        <p>If you do not receive the email, check your spam, junk, social or other folders. Or contact your FOLIO system administrator.</p>
      </StripesTemplate>
    );
  }

  return (
    <StripesTemplate branding={branding}>
      <Form
        onSubmit={handleSubmit}
        render={({ handleSubmit, pristine }) => (
          <form
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
            <SelectAndDispatchTenant styles={styles} />
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
                    inputClass={styles.loginInput}
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
                  >
                    <FormattedMessage id="stripes-hub.button.continue" />
                  </Button>
                </div>
              </Col>
            </Row>
            <Row center="xs">
              <Col xs={6}>
                <div className={styles.authErrorsWrapper}>
                  <AuthErrorsContainer errors={errors} />
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
