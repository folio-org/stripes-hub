import { useState } from 'react';
import { useMutation } from 'react-query';

/**
 * validate an email address
 * Email address validation is notoriously difficult. I don't know where this
 * particular regex came from but it shares substantially with well-known
 * versions such as https://emailregex.com/ and does a good enough job for us.
 *
 * This was introduced in STCOR-276/PR #496
 */
export const isValidEmail = (input) => {
  // eslint-disable-next-line no-useless-escape
  const emailRegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  return emailRegExp.test(input);
};

export const isValidPhoneNumber = (input) => {
  const phoneRegExp = /^\d+([.-]+\d+)*$/;

  return phoneRegExp.test(input);
};

export const isValidEmailOrPhoneNumber = (input) => {
  const normalizedInput = String(input)
    .toLowerCase()
    .trim();

  return isValidEmail(normalizedInput) || isValidPhoneNumber(normalizedInput);
};

/**
 * return a POST mutator that accepts a single argument, id, corresponding
 * to an email, or phone number. On success, the endpoint will send a "reset
 * password" email to the primary email address on file for the given id. On
 * failure, it returns 400 with a body shaped like
 *   {
 *     { errors: [ { message, type, code, parameters: []}] },
 *     "total_records": 1
 *   }
 *
 */
const useForgotUsername = ({ config, tenant }) => {
  const [userEmail, setUserEmail] = useState(null);
  const [errors, setErrors] = useState([]);
  const pathPrefix = config.authnUrl ? 'users-keycloak' : 'bl-users';

  const processBadResponse = () => Promise.resolve(['boom']);

  const mutation = useMutation({
    mutationFn: (id) => fetch(`${config.gatewayUrl}/${pathPrefix}/forgotten/username`, {
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
    setUserEmail(null);
    setErrors([]);
    const { userInput } = values;

    if (isValidEmailOrPhoneNumber(userInput)) {
      try {
        await mutation.mutateAsync(userInput);
        setUserEmail(userInput);
      } catch (error) {
        const res = await processBadResponse(undefined, error.response)
        setErrors(res);
      }
    } else {
      setErrors(['invalid email or phone number'])
    }
  };

  return {
    errors, handleSubmit, userEmail
  }
};

export default useForgotUsername;
