import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Button, Col, OrganizationLogo, Row, Select } from './StripesComponents';
import { getLoginUrl, getCurrentTenant } from './loginServices';
import styles from './index.css';

export function sortedTenantOptions(tenantOptions) {
  return Object.values(tenantOptions)
    .toSorted((a, b) => {
      const aComparable = a.sortableName || a.displayName || a.name;
      const bComparable = b.sortableName || b.displayName || b.name;
      return aComparable.localeCompare(bComparable);
    })
    .map(i => ({ value: i.name, label: i.displayName ?? i.name }));
}

function PreLoginLanding({ onSelectTenant, config, branding, tenantOptions }) {
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
    <main style={{ width: '100%' }}>
      <div>
        <div className={styles.container}>
          <Row center="xs">
            <Col xs={6}>
              <OrganizationLogo branding={branding} />
            </Col>
          </Row>
          <Row center="xs">
            <Col xs={3}>
              <Select
                label={intl.formatMessage({ id: 'stripes-core.tenantLibrary' })}
                defaultValue=""
                onChange={handleChangeTenant}
                dataOptions={[...options, { value: '', label: intl.formatMessage({ id: 'stripes-core.tenantChoose' }) }]}
              />
              <Button
                buttonClass={styles.submitButton}
                disabled={isButtonDisabled}
                onClick={redirectToLogin}
                buttonStyle="primary"
                fullWidth
              >
                {intl.formatMessage({ id: 'stripes-core.button.continue' })}
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    </main>
  );
}

PreLoginLanding.propTypes = {
  onSelectTenant: PropTypes.func.isRequired,
};

export default PreLoginLanding;
