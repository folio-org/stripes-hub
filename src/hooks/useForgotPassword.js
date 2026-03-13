import { useState } from 'react';
import { useMutation } from 'react-query';

/**
 * Return a form-handler function and a state variable indicating whether
 * the handler ran. The forgot-password API returns 2xx no matter what input
 * it receives, regardless of whether it was able to locate a matching account
 * and successfully send a "reset your password" email. Yay security! Boo, UX.
 * Alas. At least it simplifies error handling, since success and failure look
 * exactly the same.
 *
 */
const useForgotPassword = ({ config, tenant }) => {
  const [didMutate, setDidMutate] = useState(false);
  const pathPrefix = config.authnUrl ? 'users-keycloak' : 'bl-users';

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
    setDidMutate(null)
    const { userInput } = values;

    try {
      await mutation.mutateAsync(userInput);
    } catch (error) {
      console.warn(error);
    }
    setDidMutate(true);
  };

  return {
    handleSubmit, didMutate
  }
};

export default useForgotPassword;
