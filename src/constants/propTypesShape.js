import PropTypes from "prop-types";

export const brandingShape = {
  favicon: PropTypes.shape({
    src: PropTypes.string,
  }),
  logo: PropTypes.shape({
    alt: PropTypes.string,
    src: PropTypes.string,
  }),
};

export const configShape = {
  authnUrl: PropTypes.string.isRequired,
  discoveryUrl: PropTypes.string,
  gatewayUrl: PropTypes.string.isRequired,
};