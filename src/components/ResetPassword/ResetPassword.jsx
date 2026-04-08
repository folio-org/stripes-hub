import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FormattedMessage } from 'react-intl';
import {
  Field,
  Form,
} from 'react-final-form';

import isEmpty from 'lodash/isEmpty';

import {
  TextField,
  Button,
  Row,
  Col,
  Headline,
  OrganizationLogo
} from '../../StripesComponents';

import PasswordStrength from './PasswordStrength';

import PasswordRequirementsList from './PasswordRequirementsList';

import AuthErrorsContainer from './AuthErrorsContainer';
import FieldLabel from './FieldLabel';

import styles from './ResetPassword.module.css';

class ResetPassword extends Component {
  static propTypes = {
    config: PropTypes.object.isRequired,
    branding: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    clearAuthErrors: PropTypes.func.isRequired,
    onPasswordInputFocus: PropTypes.func.isRequired,
    submitting: PropTypes.bool,
    submitIsFailed: PropTypes.bool,
  };

  static defaultProps = {
    submitting: false,
    submitIsFailed: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      passwordMasked: true,
    };
    this.translationNamespaces = {
      module: 'stripes-hub',
      smartComponents: 'stripes-smart-components',
      page: 'stripes-hub.createResetPassword',
      errors: 'stripes-hub.errors',
      button: 'stripes-hub.button',
    };
    this.passwordMatchErrorCode = 'password.match.error';
    this.validators = {
      confirmPassword: this.confirmPasswordFieldValidation,
    };
    this.inputColProps = {
      xs:12,
      sm:8,
    };
    this.passwordMeterColProps = {
      xs:12,
      sm:4,
      className:styles.passwordStrength,
    };
  }

  togglePasswordMask = () => {
    this.setState(({ passwordMasked }) => ({
      passwordMasked: !passwordMasked,
    }));
  };

  confirmPasswordFieldValidation = (value, { newPassword, confirmPassword } = {}) => {
    const confirmPasswordValid = !(newPassword && confirmPassword && newPassword !== confirmPassword);
    const { clearAuthErrors } = this.props;

    if (!confirmPasswordValid) {
      this.validationHandler(
        [this.passwordMatchErrorCode],
        this.translationNamespaces.errors,
      );
    } else {
      clearAuthErrors();
    }
  };

  validationHandler = (errors, translationNamespace) => {
    const { setAuthErrors } = this.props;

    const error = errors.map((error) => {
      return {
        code: error,
        translationNamespace,
      };
    });

    setAuthErrors(error);
  };

  render() {
    const {
      submitting,
      onSubmit,
      onPasswordInputFocus,
      submitIsFailed,
      config,
      branding,
      tenant,
      errors
    } = this.props;

    const { passwordMasked } = this.state;
    const submissionStatus = submitting || submitIsFailed;
    const passwordType = passwordMasked ? 'password' : 'text';
    const buttonLabelId = `${this.translationNamespaces.module}.${submitting ? 'settingPassword' : 'setPassword'}`;
    const passwordToggleLabelId = `${this.translationNamespaces.button}.${passwordMasked ? 'show' : 'hide'}Password`;

    const isButtonDisabled = getState => {
      const { newPassword, confirmPassword } = getState().values;
      return !isEmpty(errors) || submissionStatus || !(newPassword && confirmPassword);
    };

    const getPasswordValue = getState => {
      const { newPassword } = getState().values;

      return newPassword;
    };

    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <Row center="xs">
            <Col
              xs={12}
              sm={6}
            >
              <OrganizationLogo branding={branding} />
            </Col>
          </Row>
          <Row center="xs">
            <Col
              xs={12}
              sm={6}
            >
              <Headline
                margin="none"
                size="xx-large"
                tag="h1"
                data-test-h1
              >
                <FormattedMessage id={`${this.translationNamespaces.page}.header`} />
              </Headline>
            </Col>
          </Row>
          <Row>
            <Form
              onSubmit={onSubmit}
              subscription={{
                initialValues: true,
                submitting: true,
                pristine: true,
              }}
            >
              { ({ handleSubmit, form: { getState } }) => (
                <form
                  className={styles.form}
                  onSubmit={handleSubmit}
                >
                  <div data-test-new-password-field>
                    <Row center="xs">
                      <Col
                        xs={12}
                        sm={6}
                      >
                        <FieldLabel htmlFor="new-password">
                          <FormattedMessage id={`${this.translationNamespaces.page}.newPassword`} />
                        </FieldLabel>
                      </Col>
                    </Row>
                    <Row
                      center="xs"
                      end="sm"
                    >
                      <Col
                        xs={12}
                        sm={9}
                      >
                        <Field
                          id="new-password"
                          name="newPassword"
                          autoComplete="new-password"
                          component={PasswordStrength}
                          inputClass={styles.passResetInput}
                          type={passwordType}
                          hasClearIcon={false}
                          autoFocus
                          errors={errors}
                          marginBottom0
                          fullWidth
                          inputColProps={this.inputColProps}
                          passwordMeterColProps={this.passwordMeterColProps}
                          onFocus={() => onPasswordInputFocus(submitIsFailed)}
                        />
                      </Col>
                    </Row>
                    <Row center="xs">
                      <Col
                        xs={12}
                        sm={6}
                      >
                        <PasswordRequirementsList
                          passwordValue={getPasswordValue(getState)}
                          config={config}
                          tenant={tenant}
                        />
                      </Col>
                    </Row>
                  </div>
                  <div data-test-confirm-password-field>
                    <Row center="xs">
                      <Col
                        xs={12}
                        sm={6}
                      >
                        <FieldLabel htmlFor="confirm-password">
                          <FormattedMessage id={`${this.translationNamespaces.page}.confirmPassword`} />
                        </FieldLabel>
                      </Col>
                    </Row>
                    <Row
                      end="sm"
                      center="xs"
                      bottom="xs"
                    >
                      <Col
                        xs={12}
                        sm={6}
                      >
                        <div className={styles.formGroup}>
                          <Field
                            id="confirm-password"
                            component={TextField}
                            name="confirmPassword"
                            type={passwordType}
                            marginBottom0
                            fullWidth
                            inputClass={styles.passResetInput}
                            validationEnabled={false}
                            hasClearIcon={false}
                            autoComplete="new-password"
                            validate={this.validators.confirmPassword}
                          />
                        </div>
                      </Col>
                      <Col
                        sm={3}
                        xs={12}
                      >
                        <div
                          data-test-change-password-toggle-mask-btn
                          className={styles.toggleButtonWrapper}
                        >
                          <Button
                            type="button"
                            buttonStyle="link"
                            onClick={this.togglePasswordMask}
                          >
                            <FormattedMessage id={passwordToggleLabelId} />
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <Row center="xs">
                    <Col
                      xs={12}
                      sm={6}
                    >
                      <div
                        className={styles.formGroup}
                        data-test-submit
                      >
                        <Button
                          buttonStyle="primary"
                          id="clickable-login"
                          type="submit"
                          buttonClass={styles.passResetSubmitButton}
                          disabled={isButtonDisabled(getState)}
                          fullWidth
                          marginBottom0
                        >
                          <FormattedMessage id={buttonLabelId} />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  <Row center="xs">
                    <Col
                      xs={12}
                      sm={6}
                    >
                      <div className={styles.authErrorsWrapper}>
                        <AuthErrorsContainer errors={errors} />
                      </div>
                    </Col>
                  </Row>
                </form>
              )}
            </Form>
          </Row>
        </div>
      </div>
    );
  }
}

export default ResetPassword;