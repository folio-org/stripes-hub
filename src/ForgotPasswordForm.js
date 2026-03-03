import PropTypes from 'prop-types';
import { Field, Form } from 'react-final-form';
import { FormattedMessage, useIntl } from 'react-intl';

import { getLoginTenant } from './loginServices';
import StripesTemplate from './StripesTemplate';

import {
  OrganizationLogo, SelectAndDispatchTenant, FieldLabel, Headline, Row, Col,
  TextField, Button, AuthErrorsContainer
} from './StripesComponents'

const ForgotPasswordForm = ({ branding, config, errors = [], onSubmit }) => {
  const styles = {};

  const { name: tenant } = getLoginTenant(config);

  const intl = useIntl();
  const forgotPasswordPlaceholder = intl.formatMessage({ id: 'stripes-hub.ForgotPassword.placeholder' });

  return (
    <StripesTemplate branding={branding}>
      <Form
        onSubmit={onSubmit}
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

ForgotPasswordForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  errors: PropTypes.arrayOf(PropTypes.object),
};

export default ForgotPasswordForm;
