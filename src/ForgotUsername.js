import React, { useState } from 'react';

import useForgotUsernameMutation from './hooks/useForgotUsernameMutation';
import { getLoginTenant, processBadResponse } from './loginServices';
import { defaultErrors } from './constants';
import ForgotUsernameForm from './ForgotUsernameForm';
// import { validateForgotUsernameForm as isValidUsername } from './validators';

const ForgotUsername = ({ stripes, config, branding }) => {
  const { name: tenant } = getLoginTenant(config);

  const [userEmail, setUserEmail] = useState(null);
  const [isValidInput, setIsValidInput] = useState(true);
  const [authFailure, setAuthFailure] = useState([]);
  const sendReminderMutation = useForgotUsernameMutation({ stripes, tenant });

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
    return <h1>Check yer email homeslice</h1>;
  }

  // if (userEmail) {
  //   return <Redirect to={{ pathname: '/check-email', state: { userEmail } }} />;
  // }

  return (
    <ForgotUsernameForm
      stripes={stripes}
      config={config}
      branding={branding}
      isValid={isValidInput}
      errors={authFailure}
      onSubmit={handleSubmit}
    />
  );
};

export default ForgotUsername;
