import { useState } from 'react';
import { useMutation } from 'react-query';

/**
 * validate an email address
 * Email address validation is notoriously difficult. I don't know where this
 * particular regex came from but it shares substantially with well-known
 * versions such as https://emailregex.com/ and does a good enough job for us.
 *
 * This was introduced in STCOR-276/PR #496
 *
 * @param {string} input
 * @returns boolean
 */
export const isValidEmail = (input) => {
  // eslint-disable-next-line no-useless-escape
  const emailRegExp = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  return emailRegExp.test(input);
};

/**
 * validate a phone number, but just barely
 * Returns true if the input string is just numbers, dots, dashes
 *
 * @param {string} input
 * @returns boolean
 */
export const isValidPhoneNumber = (input) => {
  const phoneRegExp = /^\d+([.-]+\d+)*$/;

  return phoneRegExp.test(input);
};

/**
 * validate that input is either an email address or a phone number
 * @param {string} input
 * @returns boolean
 */
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
  const [didMutate, setDidMutate] = useState(false);
  const [isError, setIsError] = useState(false);
  const pathPrefix = config.authnUrl ? 'users-keycloak' : 'bl-users';

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
    setDidMutate(null);
    setIsError(false);
    const { userInput } = values;

    if (isValidEmailOrPhoneNumber(userInput)) {
      try {
        await mutation.mutateAsync(userInput);
        setDidMutate(true);
      } catch (error) {
        console.warn(error);
      }
      setDidMutate(true);
    } else {
      setIsError(true);
    }
  };

  return {
    isError, handleSubmit, didMutate
  }
};

export default useForgotUsername;
