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
const useForgotPasswordMutation = ({ stripes, tenant }) => {
  const pathPrefix = stripes.authnUrl ? 'users-keycloak' : 'bl-users';

  const mutation = useMutation({
    mutationFn: (id) => fetch(`${stripes.url}/${pathPrefix}/forgotten/password`, {
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

  return mutation;
};

export default useForgotPasswordMutation;

