import { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './FieldLabel.module.css';

export default class FieldLabel extends Component {
  static propTypes = {
    htmlFor: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  };

  render() {
    const {
      htmlFor,
      children
    } = this.props;

    return (
      <label
        htmlFor={htmlFor}
        className={styles.label}
      >
        {children}
      </label>
    );
  }
}
