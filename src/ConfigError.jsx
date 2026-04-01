import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { Col, Row } from './StripesComponents';
import StripesTemplate from './StripesTemplate';

function ConfigError({ branding, config }) {
  console.error('The config object is incomplete or incorrect', config);

  return (
    <StripesTemplate branding={branding}>
      <Row center="xs">
        <Col xs={12}>
          <h1><FormattedMessage id="stripes-hub.ConfigError.headline" /></h1>
        </Col>
      </Row>
    </StripesTemplate>
  );
}

ConfigError.propTypes = {
  branding: PropTypes.shape({
    altText: PropTypes.string,
    logo: PropTypes.string,
  }).isRequired,
  config: PropTypes.object,
};

export default ConfigError;
