import PropTypes from 'prop-types';

import { Col, OrganizationLogo, Row } from './StripesComponents';
import styles from './index.css';

function StripesTemplate({ branding, children }) {
  return (
    <main style={{ width: '100%' }} className="container">
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
  branding: PropTypes.shape({
    logo: PropTypes.string,
    altText: PropTypes.string,
  }).isRequired,
  children: PropTypes.node.isRequired,
};

export default StripesTemplate;
