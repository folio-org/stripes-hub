import { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Button, Col, Row, Select } from './StripesComponents';
import { getLoginUrl, getCurrentTenant } from './loginServices';
import styles from './index.module.css';
import StripesTemplate from './StripesTemplate';

export function sortedTenantOptions(tenantOptions) {
  return Object.values(tenantOptions)
    .toSorted((a, b) => {
      const aComparable = a.sortableName || a.displayName || a.name;
      const bComparable = b.sortableName || b.displayName || b.name;
      return aComparable.localeCompare(bComparable);
    })
    .map(i => ({ value: i.name, label: i.displayName ?? i.name }));
}

function PreLoginLanding({ branding, config, onSelectTenant, tenantOptions }) {
  const intl = useIntl();

  const options = sortedTenantOptions(tenantOptions);

  const redirectToLogin = () => {
    const currentTenant = getCurrentTenant();

    if (!currentTenant?.name) return;
    if (config.authnUrl) {
      window.location.assign(getLoginUrl(config, currentTenant.name, currentTenant.clientId));
    }
    return;
  };

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const handleChangeTenant = (e) => {
    const tenantName = e.target.value;
    setIsButtonDisabled(!tenantName);
    if (tenantName === '') {
      onSelectTenant('', '');
      return;
    }
    const clientId = tenantOptions[tenantName].clientId;
    onSelectTenant(tenantName, clientId);
  };

  return (
    <StripesTemplate branding={branding}>
      <Row center="xs">
        <Col xs={3}>
          <Select
            label={intl.formatMessage({ id: 'stripes-hub.PreLoginLanding.tenantLibrary' })}
            defaultValue=""
            onChange={handleChangeTenant}
            dataOptions={[...options, { value: '', label: intl.formatMessage({ id: 'stripes-hub.PreLoginLanding.tenantChoose' }) }]}
          />
          <Button
            className={styles.submitButton}
            disabled={isButtonDisabled}
            onClick={redirectToLogin}
          >
            {intl.formatMessage({ id: 'stripes-hub.PreLoginLanding.button.continue' })}
          </Button>
        </Col>
      </Row>
    </StripesTemplate>
  );
}

PreLoginLanding.propTypes = {
  branding: PropTypes.shape({
    favicon: PropTypes.shape({
      src: PropTypes.string,
    }),
    logo: PropTypes.shape({
      alt: PropTypes.string,
      src: PropTypes.string,
    }),
  }),
  config: PropTypes.shape({
    authnUrl: PropTypes.string.isRequired,
  }).isRequired,
  onSelectTenant: PropTypes.func.isRequired,
  tenantOptions: PropTypes.object.isRequired,
};

export default PreLoginLanding;
