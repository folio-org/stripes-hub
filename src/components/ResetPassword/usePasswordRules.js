import { useQuery } from 'react-query';

const usePasswordRules = (rulesLimit, config, tenant, locale = 'en') => {
  //const { locale = 'en', tenant, url } = useStripes().okapi;

  const searchParams = new URLSearchParams({
    limit: rulesLimit,
  });

  const { data } = useQuery(
    ['requirements-list'],
    async () => {
      const response = await fetch(`${config.gatewayUrl}/tenant/rules?${searchParams.toString()}`, {
        headers: {
          'Accept-Language': locale,
          'X-Okapi-Tenant': tenant,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  );

  return ({
    rules: data?.rules,
  });
};

export default usePasswordRules;
