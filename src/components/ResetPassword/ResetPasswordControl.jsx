import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { processBadResponse } from '../../loginServices';
import { defaultErrors } from '../../constants';
import { OrganizationLogo } from '../../StripesComponents';

import ResetPassword from './ResetPassword';
import PasswordNotChanged from './PasswordNotChanged';
import PasswordSuccessfullyChanged from './PasswordSuccessfullyChanged';
import { isArray } from 'lodash';

class ResetPasswordControl extends Component {
  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.string,
      search: PropTypes.string.isRequired,
    }),
    config: PropTypes.object.isRequired,
    branding: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      isSuccessfulPasswordChange: false,
      submitIsFailed: false,
      authFailure: [],
      isValidToken: false,
      isLoading: true,
    };
  }

  async componentDidMount() {
    this._isMounted = true;
    await this.makeCall();

    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.clearAuthErrors();
  }

  handleResponse = (response, action) => {
    const { isValidToken } = this.state;

    switch (response.status) {
      case 204:
        if (action === 'reset') {
          this.setState({ isSuccessfulPasswordChange: true });
        } else if (action === 'validate' && !isValidToken) {
          this.setState({ isValidToken: true });
        }
        break;
      case 401:
        this.setState({
          submitIsFailed: true,
          authFailure: [...this.state.authFailure, defaultErrors.INVALID_LINK_ERROR]
        });
        break;
      case 500:
        throw new Error(response.status);
      default:
        this.setState({
          submitIsFailed: true,
        });
        this.handleBadResponse(response);
    }
  };

  makeCall = async (body) => {
    const {
      config,
      location,
    } = this.props;
    const { isValidToken } = this.state;
    const { gatewayUrl } = config;

    const params = new URLSearchParams(location.search);
    const tenant = params.get('tenant');
    const urlPaths = location.pathname.split('/').slice(1); // split path into parts and remove leading empty string
    const token = urlPaths?.length > 1 ? urlPaths[1] : ''; // grab the token from the URL path (if it exists there)

    // Token value from match.params.token comes from React-Router parsing the value from the URL path /:token?
    // This part of the path is optional (hence the ?) and can instead be placed in the URL param `resetToken`
    // to allow for keys longer than the URL length restriction of 2048 characters.
    const resetToken = token ?? params.get('resetToken');
    const action = isValidToken ? 'reset' : 'validate';
    const path = `${gatewayUrl}/users-keycloak/password-reset/${action}`;

    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-okapi-token': resetToken,
        'x-okapi-tenant': tenant,
      },
      ...(body && { body: JSON.stringify(body) }),
      // this endpoint will return a 401 if the reset-token is expired/invalid.
      // RTR will see the 401 and think the AT has expired and try to rotate,
      // but of course that would not help us here. so: hands off, RTR.
      rtrIgnore: true,
    })
      .then((response) => {
        if (this._isMounted) {
          this.handleResponse(response, action);
        }
      })
      .catch(error => {
        processBadResponse(error);
      });

    return res;
  };

  handleSubmit = async (values) => {
    const { newPassword } = values;

    await this.makeCall({ newPassword });
  };

  clearErrorsAfterSubmit = (submissionCompleted) => {
    if (submissionCompleted) {
      this.setState({ submitIsFailed: false, authFailure: [] });
    }
  };

  setAuthErrors = (errors) => {
    if (isArray(errors)) {
      this.setState({ authFailure: [...this.state.authFailure, ...errors.filter(e => !this.state.authFailure.some(a => a.code === e.code)) ] });
    } else if (!this.state.authFailure.some(e => e.code === errors.code)) {
      this.setState({ authFailure: [...this.state.authFailure, errors] });
    }
  }

  clearAuthErrors = () => {
    this.setState({ authFailure: [] });
  };

  render() {
    const {
      config,
      branding,
      location
    } = this.props;

    const params = new URLSearchParams(location.search);
    const tenant = params.get('tenant');

    const {
      isSuccessfulPasswordChange,
      submitIsFailed,
      isValidToken,
      isLoading,
      authFailure
    } = this.state;

    if (isSuccessfulPasswordChange) {
      return <PasswordSuccessfullyChanged config={config} branding={branding} />;
    }

    if (isLoading) {
      return (
        <div>
          <OrganizationLogo branding={branding} /> 
        </div>
      );
    }

    if (!isValidToken) {
      return <PasswordNotChanged branding={branding} errors={authFailure} />;
    }

    return (
      <ResetPassword
        config={config}
        branding={branding}
        tenant={tenant}
        onSubmit={this.handleSubmit}
        onPasswordInputFocus={this.clearErrorsAfterSubmit}
        submitIsFailed={submitIsFailed}
        errors={authFailure}
        setAuthErrors={this.setAuthErrors}
        clearAuthErrors={this.clearAuthErrors}
      />
    );
  }
}

export default ResetPasswordControl;
