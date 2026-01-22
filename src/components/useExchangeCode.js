import { noop } from 'lodash';

import { getLoginTenant, getHeaders } from '../loginServices';

const useExchangeCode = async (initSession = noop, stripes) => {
  let json = {};
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const loginTenant = getLoginTenant();

  if (code) {
    try {
      const params = new URLSearchParams();
      params.append("code", code);
      params.append("redirect-uri", `${window.location.protocol}//${window.location.host}/oidc-landing?tenant=${loginTenant.name}&client_id=${loginTenant.clientId}`);

      const response = await fetch(`${stripes.url}/authn/token?${params}`, {
        headers: getHeaders(loginTenant.name),
        credentials: "include"
      });

      if (response.ok === false) {
        throw { response };
      }

      json = await response.json();
      // note: initSession is expected to execute an unawaited promise.
      // initSession calls .../_self and other functions in order to
      // populate the session, eventually dispatching redux actions
      // (isAuthenticated, sessionData, okapiReady), triggering
      // RootWithIntl to re-render.
      //
      // return the json response from `authn/token` in order to
      // show a status update on the calling page while session-init
      // is still in-flight.
      initSession(json);
    } catch (fetchError) {
      // throw json from the error-response, or just rethrow
      if (fetchError?.response?.json) {
        const errorJson = await fetchError.response.json();
        throw errorJson;
      }

      throw fetchError;
    }
  } else {

    // eslint-disable-next-line no-throw-literal
    throw new Error('OTP code is missing');
  }

  return json;
};

export default useExchangeCode;
