import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import StripesTemplate from './StripesTemplate';
import { brandingShape } from './constants';

const ForgotDidMutate = ({ branding }) => {
  return (
    <StripesTemplate branding={branding}>
      <h1><FormattedMessage id="stripes-hub.ForgotDidMutate.checkYourEmail" /></h1>
      <h2><FormattedMessage id="stripes-hub.ForgotDidMutate.sent" /></h2>
      <h2><FormattedMessage id="stripes-hub.ForgotDidMutate.missing" /></h2>
    </StripesTemplate>
  );
};

ForgotDidMutate.propTypes = {
  branding: PropTypes.shape(brandingShape).isRequired,
}

export default ForgotDidMutate;
