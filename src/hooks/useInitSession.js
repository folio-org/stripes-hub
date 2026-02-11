import { useQuery } from 'react-query';

import {
  getCurrentTenant,
  getHeaders,
  getSession,
  initStripes,
  setUnauthorizedPathToSession,
  USERS_PATH,
} from '../loginServices';

const useInitSession = async (config, loginUrl) => {

  const getSessionTenant = (session) => {
    return session.tenant;
  };

  const authenticate = () => {
    // Cache the current path so we can return to it after authenticating.
    if (globalThis.location.pathname !== '/') {
      setUnauthorizedPathToSession();
    }
    globalThis.location.replace(loginUrl);
  };

  const sessionIsValid = (session) => {
    return !!session?.isAuthenticated;
  };

  /**
   * validateSession
   * Data in localstorage has led us to believe a session is active. To confirm,
   * fetch from .../_self and dispatch the results, allowing any changes to authz
   * since that session data was persisted to take effect immediately.
   *
   * If the fetch succeeds, dispatch the result to update the session.
   * Otherwise, call logout() to purge redux and storage because either:
   *   1. the session data was corrupt. yikes!
   *   2. the session data was valid but cookies were missing. yikes!
   * Either way, our belief that a session is active has been proven wrong, so
   * we want to clear out all relevant storage.
   *
   * @param {*} session session object
   * @param {function} handleError error-handler function; returns a Promise that returns null
   *
   * @returns {Promise} resolves to user data if session is valid, or the result of handleError() if not
   */
  const validateSession = async (session, handleError) => {
    try {
      const tenant = getCurrentTenant().name;
      const { token, tenant: sessionTenant = tenant } = session;

      const resp = await fetch(`${config.gatewayUrl}/${USERS_PATH}/_self?expandPermissions=true`, {
        headers: getHeaders(sessionTenant, token),
        credentials: 'include',
        mode: 'cors',
      });
      if (resp.ok) {
        const data = await resp.json();
        return data;
      } else {
        const text = await resp.text();
        throw text;
      }
    } catch (error) {
      // log a warning, then call the error handler if we received one
      console.error(error); // eslint-disable-line no-console
      return handleError ? handleError() : Promise.resolve();
    }
  };

  const { isFetching, data, error } = useQuery(
    ['@folio/stripes-core', 'initSession'],
    async () => {
      try {
        const session = await getSession();

        session?.user?.id ? await validateSession(session, authenticate) : authenticate();

        if (session && sessionIsValid(session)) {
          const tenant = getSessionTenant(session);
          const { tenant: sessionTenant = tenant } = session;

          // note: initSession is expected to execute an unawaited promise.
          // initSession calls .../_self and other functions in order to
          // populate the session, eventually triggering a re-render. so,
          // even though it's async, we do not await it here, instead
          // returning the response-json that can be used to show a status
          // update while session-init is still in-flight.
          initStripes(config, sessionTenant);

          return session;
        } else {
          authenticate();
        }
      } catch (e) {
        console.error('error during StripesHub init', e); // eslint-disable-line no-console
        alert(`error during StripesHub init: ${JSON.stringify(e, null, 2)}`); // eslint-disable-line no-alert
      }
    },
    {
      retry: false,
    }
  );

  return ({
    sessionData: data,
    isLoading: isFetching,
    error,
  });
};

export default useInitSession;
