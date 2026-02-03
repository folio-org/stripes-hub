import PropTypes from 'prop-types';
import { Field, Form } from 'react-final-form';
import { FormattedMessage, useIntl } from 'react-intl';

import { getLoginTenant } from './loginServices';

export const OrganizationLogo = ({ branding }) => <img src={branding.logo.src} alt={branding.logo.alt} width="300px" />;
export const SelectAndDispatchTenant = () => { };
export const FieldLabel = (props) => {
  const { children, ...rest } = props;
  return <label htmlFor={props.htmlFor} {...rest}>{children}</label>;
}
export const Headline = ({ children }) => <h1>{children}</h1>;
export const Row = ({ children }) => <div>{children}</div>;
export const Col = ({ children }) => <span>{children}</span>;
export const TextField = (props) => <input {...props.input} />;
export const Button = (props) => {
  const { children, ...rest } = props;
  return <button {...rest.input}>{children}</button>
}
export const AuthErrorsContainer = ({ errors }) => errors.length ? <div><pre>{JSON.stringify(errors)}</pre></div> : null;

