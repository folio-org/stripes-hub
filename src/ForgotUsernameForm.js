import PropTypes from 'prop-types';
import { Field, Form } from 'react-final-form';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  OrganizationLogo, SelectAndDispatchTenant, FieldLabel, Headline, Row, Col,
  TextField, Button, AuthErrorsContainer
} from './StripesComponents'
import { getLoginTenant } from './loginServices';
import StripesTemplate from './StripesTemplate';


const ForgotUserNameForm = ({ config, branding, errors = [], isValid, onSubmit }) => {
  const styles = {};
  const intl = useIntl();
  const forgotUsernamePlaceholder = intl.formatMessage({ id: 'stripes-hub.ForgotUsername.placeholder' });
  const { name: tenant } = getLoginTenant(config);

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
                    errors={!isValid
                      ? [{ code: forgotFormErrorCodes.EMAIL_INVALID }]
                      : errors
                    }
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

ForgotUserNameForm.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.object),
  isValid: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ForgotUserNameForm;
