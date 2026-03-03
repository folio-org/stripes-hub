import React, { useState } from 'react';

import useForgotUsernameMutation from './hooks/useForgotUsernameMutation';
import { getLoginTenant, hideEmail, processBadResponse } from './loginServices';
import { defaultErrors } from './constants';
import ForgotUsernameForm from './ForgotUsernameForm';
import StripesTemplate from './StripesTemplate';
// import { validateForgotUsernameForm as isValidUsername } from './validators';

const ForgotUsername = ({ branding, config }) => {
  const { name: tenant } = getLoginTenant(config);

  const [userEmail, setUserEmail] = useState(null);
  const [isValidInput, setIsValidInput] = useState(true);
  const [authFailure, setAuthFailure] = useState([]);
  const sendReminderMutation = useForgotUsernameMutation({ config, tenant });

  const handleSubmit = async (values) => {
    setUserEmail(null);
    setAuthFailure([]);
    const { userInput } = values;
    const { FORGOTTEN_USERNAME_CLIENT_ERROR } = defaultErrors;

    const isValidUsername = (str) => true;
    if (isValidUsername(userInput)) {
      try {
        await sendReminderMutation.mutateAsync(userInput);
        setUserEmail(userInput);
      } catch (error) {
        const res = await processBadResponse(undefined, error.response, FORGOTTEN_USERNAME_CLIENT_ERROR);
        setIsValidInput(true);
        setAuthFailure(res);
      }
    } else {
      setIsValidInput(false);
    }
  };

  if (userEmail) {
    history.pushState({}, "", "/check-email");
    return (
      <StripesTemplate branding={branding}>
        <p>An email has been sent to {hideEmail(userEmail)}</p>
        <p>If you don't receive the email, check your spam, junk, social or other folders. Or contact your FOLIO system administrator.</p>
      </StripesTemplate>
    );
  }

  // if (userEmail) {
  //   return <Redirect to={{ pathname: '/check-email', state: { userEmail } }} />;
  // }

  return (
    <ForgotUsernameForm
      branding={branding}
      config={config}
      errors={authFailure}
      isValid={isValidInput}
      onSubmit={handleSubmit}
    />
  );
};

export default ForgotUsername;
