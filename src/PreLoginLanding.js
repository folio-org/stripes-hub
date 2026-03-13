import { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Button, Col, Row, Select } from './StripesComponents';
import { getLoginUrl, getCurrentTenant } from './loginServices';
import StripesTemplate from './StripesTemplate';
import { sharedMessages } from './constants/sharedMessages';
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

function PreLoginLanding({ branding, config, onSelectTenant, tenantOptions }) {
  const { $t } = useIntl();

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
            label={$t(sharedMessages.tenantLibrary)}
            defaultValue=""
            onChange={handleChangeTenant}
            dataOptions={[...options, { value: '', label: $t(sharedMessages.tenantChoose) }]}
          />
          <Button
            className={styles.submitButton}
            disabled={isButtonDisabled}
            onClick={redirectToLogin}
          >
            {$t(sharedMessages.continueButton)}
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
