import { useQuery } from 'react-query';
import { useIntl } from 'react-intl';
import noop from 'lodash/noop';

import { getLoginTenant, getHeaders } from '../loginServices';

const useExchangeCode = async (config, initSession = noop) => {
  const intl = useIntl();
  const urlParams = new URLSearchParams(globalThis.location.search);
  const code = urlParams.get('code');
  const loginTenant = getLoginTenant();

  const { isFetching, data, error } = useQuery(
    ['@folio/stripes-core', 'authn/token', code],
    async () => {
      if (code) {
        try {
          const params = new URLSearchParams();
          params.append("code", code);
          params.append("redirect-uri", `${globalThis.location.protocol}//${globalThis.location.host}/oidc-landing?tenant=${loginTenant.name}&client_id=${loginTenant.clientId}`);

          const response = await fetch(`${config.hostUrl}/authn/token?${params}`, {
            headers: getHeaders(loginTenant.name),
            credentials: "include"
          });

          const json = await response.json();

          // note: initSession is expected to execute an unawaited promise.
          // initSession calls .../_self and other functions in order to
          // populate the session, eventually triggering a re-render. so,
          // even though it's async, we do not await it here, instead
          // returning the response-json that can be used to show a status
          // update while session-init is still in-flight.
          initSession(json);

          return json;
        } catch (fetchError) {
          // throw json from the error-response, or just rethrow
          if (fetchError?.response?.json) {
            const errorJson = await fetchError.response.json();
            throw errorJson;
          }

          throw fetchError;
        }
      }

      // eslint-disable-next-line no-throw-literal
      throw intl.formatMessage({ id: 'stripes-core.oidc.otp.missingCode' });
    },
    {
      retry: false,
    }
  );

  return ({
    tokenData: data,
    isLoading: isFetching,
    error,
  });
};

export default useExchangeCode;
