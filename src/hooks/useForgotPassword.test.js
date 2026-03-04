import { useState } from 'react';
import { useMutation } from 'react-query';

/**
 * return a POST mutator that accepts a single argument, id, corresponding
 * to an email, username, or phone number. On success, the endpoint will
 * send a "reset password" email to the primary email address on file for the
 * given id. On failure, it returns 400 with a body shaped like
 *   {
 *     { errors: [ { message, type, code, parameters: []}] },
 *     "total_records": 1
 *   }
 *
 */
const useForgotPassword = ({ config, tenant }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [errors, setErrors] = useState([]);
  const pathPrefix = config.authnUrl ? 'users-keycloak' : 'bl-users';

  const processBadResponse = () => Promise.resolve(['boom']);

  const mutation = useMutation({
    mutationFn: (id) => fetch(`${config.gatewayUrl}/${pathPrefix}/forgotten/password`, {
      "headers": {
        "accept": "application/json",
        "content-type": "application/json",
        "x-okapi-tenant": tenant
      },
      "body": JSON.stringify({ id }),
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    })
  });

  const handleSubmit = async (values) => {
    console.log({ values })
    setUserEmail(null)
    setErrors([]);
    const { userInput } = values;
    // const { FORGOTTEN_PASSWORD_CLIENT_ERROR } = defaultErrors;

    try {
      await mutation.mutateAsync(userInput);
      setUserEmail(userInput);
    } catch (error) {
      const res = await processBadResponse(error.response, 'RUH_ROH');
      setErrors(res);
    }
  };

  return {
    errors, handleSubmit, userEmail
  }
};

export default useForgotPassword;
