import PropTypes from 'prop-types';

import { Col, OrganizationLogo, Row } from './StripesComponents';
import { brandingShape } from './constants';

const StripesTemplate = ({ branding, children }) => {
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
  branding: brandingShape.isRequired,
  children: PropTypes.node.isRequired,
};

export default StripesTemplate;
