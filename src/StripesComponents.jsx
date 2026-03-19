import PropTypes from 'prop-types';
import styles from './index.module.css';

export const AuthErrorsContainer = ({ errors }) => errors.length ? <div className={styles.errorContainer}><h2>⚠️ {errors}</h2></div> : null;
AuthErrorsContainer.propTypes = {
  errors: PropTypes.array
};

export const Button = (props) => {
  const { buttonRef, css, children, disabled, onClick, to, type, ref } = props;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      to={to}
      {...props}
      ref={buttonRef || ref}
    >
      <span className={css?.inner}>
        {children}
      </span>
    </button>
  );
};
Button.propTypes = {
  buttonRef: PropTypes.oneOf([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  children: PropTypes.node,
  css: PropTypes.shape({
    inner: PropTypes.string,
  }),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  ref: PropTypes.oneOf([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  to: PropTypes.string,
  type: PropTypes.string,
}

export const Col = ({ children }) => <span>{children}</span>;
Col.propTypes = {
  children: PropTypes.node,
}

export const FieldLabel = (props) => {
  const { children, ...rest } = props;
  return <label htmlFor={props.htmlFor} {...rest}>{children}</label>;
}
FieldLabel.propTypes = {
  children: PropTypes.node,
  htmlFor: PropTypes.string,
}

export const Headline = ({ children }) => <h1>{children}</h1>;
Headline.propTypes = {
  children: PropTypes.node,
}

export const OrganizationLogo = ({ branding }) => <img src={branding.logo.src} alt={branding.logo.alt} width="300px" />;
OrganizationLogo.propTypes = {
  branding: PropTypes.shape({
    logo: PropTypes.shape({
      src: PropTypes.string,
      alt: PropTypes.string,
    })
  })
}

export const Row = ({ children }) => <div>{children}</div>;
Row.propTypes = {
  children: PropTypes.node,
}

export const Select = (props) => {
  const { dataOptions, readOnly, ...rest } = props;
  const options = [];
  if (dataOptions) {
    dataOptions.forEach((option, i) => {
      options.push(
        <option
          value={option.value}
          key={option.id || `option-${i}`}
          disabled={option.disabled || (readOnly && option.value !== props.value)}
        >
          {option.label}
        </option>
      );
    });
  }
  return <select {...rest}>{options}</select>
}
Select.propTypes = {
  children: PropTypes.node,
  dataOptions: PropTypes.arrayOf(PropTypes.shape({
    disabled: PropTypes.bool,
    value: PropTypes.string,
    label: PropTypes.string
  })),
  readOnly: PropTypes.bool,
  value: PropTypes.string,
}

export const TextField = (props) => <div className={styles.formControl}><input {...props.input} id={props.id} /></div>;
TextField.propTypes = {
  id: PropTypes.string,
  input: PropTypes.object,
}
