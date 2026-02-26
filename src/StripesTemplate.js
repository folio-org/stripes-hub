import { useIntl, FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { Col, OrganizationLogo, Row } from './StripesComponents';
import styles from './index.css';

function StripesTemplate({ branding, children }) {
  const intl = useIntl();

  return (
    <main style={{ width: '100%' }}>
      <div>
        <div className={styles.container}>
          <Row center="xs">
            <Col xs={12}>
              <OrganizationLogo branding={branding} />
            </Col>
          </Row>
          {children}
        </div>
      </div>
    </main>
  );
}

StripesTemplate.propTypes = {
  branding: PropTypes.shape({
    logo: PropTypes.string,
    altText: PropTypes.string,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

export default StripesTemplate;
