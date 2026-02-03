import React, { useState } from 'react';

import { processBadResponse } from './loginServices';
import { defaultErrors } from './constants';
import ForgotPasswordForm from './ForgotPasswordForm';
import useForgotPasswordMutation from './hooks/useForgotPasswordMutation';
import { getLoginTenant } from './loginServices';


const ForgotPassword = ({ stripes, config, branding }) => {
  const { name: tenant } = getLoginTenant(config);

  const [userEmail, setUserEmail] = useState(null);
  const [authFailure, setAuthFailure] = useState([]);
  const sendReminderMutation = useForgotPasswordMutation({ stripes, tenant });

  const onSubmit = async (values) => {
    setUserEmail(null)
    setUserEmail(null);
    setAuthFailure([]);
    const { userInput } = values;
    const { FORGOTTEN_PASSWORD_CLIENT_ERROR } = defaultErrors;

    try {
      await sendReminderMutation.mutateAsync(userInput);
      setUserEmail(userInput);
    } catch (error) {
      window.foo = error
      console.error({ error })
      const res = await processBadResponse(error.response, FORGOTTEN_PASSWORD_CLIENT_ERROR);
      setAuthFailure(res);
    }
  };

  // stripes-core handles this with a redirect to check-email, as below.
  // maybe we want to keep that, because a11y? if so, we should fix the
  // check-email component so it doesn't explode when called directly,
  // i.e. when its state is missing
  if (userEmail) {
    return <h1>Check yer email homeslice</h1>;
  }

  // if (userEmail) {
  //   return <Redirect to={{ pathname: '/check-email', state: { userEmail } }} />;
  // }

  return (
    <ForgotPasswordForm
      stripes={stripes}
      config={config}
      branding={branding}
      errors={authFailure}
      onSubmit={onSubmit}
    />
  );
};

export default ForgotPassword;
