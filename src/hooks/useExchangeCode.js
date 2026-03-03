import { useQuery } from 'react-query';
import { useIntl } from 'react-intl';
import noop from 'lodash/noop';

import { getLoginTenant, getHeaders, StripesHubError } from '../loginServices';

const useExchangeCode = (config, initSession = noop) => {
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

          const response = await fetch(`${config.gatewayUrl}/authn/token?${params}`, {
            headers: getHeaders(loginTenant.name),
            credentials: "include"
          });

          const json = await response.json();

          if (response.ok) {
            // initSession eventually redirects to /
            await initSession(json);
            return json;
          }

          throw new StripesHubError(`Token exchange failure`, { json, id: 'stripes-hub.error.tokenExchangeFailure ' });

        } catch (error) {
          const json = error?.options?.json || null;
          throw new StripesHubError(
            `Token exchange failure`,
            { json, id: 'stripes-hub.error.tokenExchangeFailure', cause: error }
          );
        }
      }

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
