import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import { withRouter } from 'react-router-dom';
// import { connect as reduxConnect } from 'react-redux';

//import processBadResponse from '../../processBadResponse';
//import { stripesShape } from '../../Stripes';
//import { setAuthError } from '../../okapiActions';
import { processBadResponse } from '../../loginServices';
import { defaultErrors } from '../../constants';
import { Col, OrganizationLogo, Row } from '../../StripesComponents';
import { getLocationQuery } from '../../locationService';

import ResetPassword from './ResetPassword';
import PasswordNotChanged from './PasswordNotChanged';
import PasswordSuccessfullyChanged from './PasswordSuccessfullyChanged';

class ResetPasswordControl extends Component {
  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.string,
      search: PropTypes.string.isRequired,
    }),
    config: PropTypes.object.isRequired,
    branding: PropTypes.object.isRequired
  };

  static defaultProps = {
    authFailure: [],
  };

  constructor(props) {
    super(props);

    this.state = {
      isSuccessfulPasswordChange: false,
      submitIsFailed: false,
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
    //this.props.clearAuthErrors();
    this._isMounted = false;
  }

  handleResponse = (response) => {
    // const {
    //   handleBadResponse,
    //   setDefaultAuthError,
    // } = this.props;
    const { isValidToken } = this.state;

    switch (response.status) {
      case 204:
        this.setState(
          isValidToken
            ? { isSuccessfulPasswordChange: true }
            : { isValidToken: true }
        );
        break;
      case 401:
        this.setState({
          submitIsFailed: true,
        });
        setDefaultAuthError(defaultErrors.INVALID_LINK_ERROR);
        break;
      case 500:
        throw new Error(response.status);
      default:
        this.setState({
          submitIsFailed: true,
        });
        //handleBadResponse(response);
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
    const path = `${gatewayUrl}/users-keycloak/password-reset/${isValidToken ? 'reset' : 'validate'}`;

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
          this.handleResponse(response);
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
      this.setState({ submitIsFailed: false });
      //this.props.clearAuthErrors();
    }
  };

  render() {
    const {
      //authFailure,
      config,
      branding,
      location
    } = this.props;

    const params = new URLSearchParams(location.search);
    const tenant = params.get('tenant');

    const authFailure = []; // authFailure; --- IGNORE ---

    const {
      isSuccessfulPasswordChange,
      submitIsFailed,
      isValidToken,
      isLoading,
    } = this.state;

    if (isSuccessfulPasswordChange) {
      return <PasswordSuccessfullyChanged config={config} branding={branding} history={window.history} />;
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
      />
    );
  }
}

// const mapStateToProps = state => ({ authFailure: state.okapi.authFailure });
// const mapDispatchToProps = dispatch => ({
//   handleBadResponse: error => processBadResponse(dispatch, error),
//   clearAuthErrors: () => dispatch(setAuthError([])),
//   setDefaultAuthError: error => dispatch(setAuthError([error])),
// });

export default ResetPasswordControl;
