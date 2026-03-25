import PropTypes from 'prop-types';

import { Col, OrganizationLogo, Row } from './StripesComponents';
import { brandingShape } from './constants';
import styles from './index.module.css';

const StripesTemplate = ({ branding, children }) => {
  return (
    <main style={{ width: '100%' }} className={`${styles.container} ${styles.containerVars}`}>
      <div >
        <Row center="xs">
          <Col xs={12}>
            <OrganizationLogo branding={branding} />
          </Col>
        </Row>
        {children}
      </div>
    </main>
  );
}

StripesTemplate.propTypes = {
  branding: PropTypes.shape(brandingShape).isRequired,
  children: PropTypes.node.isRequired,
};

export default StripesTemplate;
