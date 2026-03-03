import React, { useState } from 'react';

import { processBadResponse } from './loginServices';
import { defaultErrors } from './constants';
import ForgotPasswordForm from './ForgotPasswordForm';
import StripesTemplate from './StripesTemplate';
import useForgotPasswordMutation from './hooks/useForgotPasswordMutation';
import { getLoginTenant, hideEmail } from './loginServices';

const ForgotPassword = ({ branding, config }) => {
  const { name: tenant } = getLoginTenant(config);

  const [userEmail, setUserEmail] = useState(null);
  const [authFailure, setAuthFailure] = useState([]);
  const sendReminderMutation = useForgotPasswordMutation({ config, tenant });

  const handleSubmit = async (values) => {
    console.log({ values })
    setUserEmail(null)
    setAuthFailure([]);
    const { userInput } = values;
    const { FORGOTTEN_PASSWORD_CLIENT_ERROR } = defaultErrors;

    try {
      await sendReminderMutation.mutateAsync(userInput);
      setUserEmail(userInput);
    } catch (error) {
      const res = await processBadResponse(error.response, FORGOTTEN_PASSWORD_CLIENT_ERROR);
      setAuthFailure(res);
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

  return (
    <ForgotPasswordForm
      branding={branding}
      config={config}
      errors={authFailure}
      onSubmit={handleSubmit}
    />
  );
};

export default ForgotPassword;
