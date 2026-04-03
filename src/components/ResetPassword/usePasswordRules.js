import ky from 'ky';
import { useQuery } from 'react-query';

const usePasswordRules = (rulesLimit, config, tenant, locale = 'en') => {
  //const { locale = 'en', tenant, url } = useStripes().okapi;

  const kyInstance = ky.create({
    prefixUrl: config.gatewayUrl,
    hooks: {
      beforeRequest: [
        request => {
          request.headers.set('Accept-Language', locale);
          request.headers.set('X-Okapi-Tenant', tenant);
        }
      ]
    },
    retry: 0,
    timeout: 30000,
  });

  const searchParams = new URLSearchParams({
    limit: rulesLimit,
  });

  const { data } = useQuery(
    ['requirements-list'],
    async () => {
      return kyInstance.get(`tenant/rules?${searchParams.toString()}`).json();
    },
  );

  return ({
    rules: data?.rules,
  });
};

export default usePasswordRules;
