import PropTypes from 'prop-types';

export const OrganizationLogo = ({ branding }) => <img src={branding.logo.src} alt={branding.logo.alt} width="300px" />;
OrganizationLogo.propTypes = {
  branding: PropTypes.shape({
    logo: PropTypes.shape({
      src: PropTypes.string,
      alt: PropTypes.string,
    })
  })
}

export const SelectAndDispatchTenant = () => { };
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
export const Row = ({ children }) => <div>{children}</div>;
Row.propTypes = {
  children: PropTypes.node,
}
export const Col = ({ children }) => <span>{children}</span>;
Col.propTypes = {
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
          disabled={option.disabled || (readOnly && option.value !== this.props.value)}
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
}

export const TextField = (props) => <input {...props.input} />;
TextField.propTypes = {
  input: PropTypes.object,
}

export const Button = (props) => {
<<<<<<< HEAD
  const { buttonRef, css, children, disabled, onClick, to, type, ref } = props;
=======
  const { buttonClass, buttonRef, css, children, disabled, onClick, to, type, ref } = props;
>>>>>>> b545ae4 (STHUB-8 forgot-* initial import)
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

export const AuthErrorsContainer = ({ errors }) => errors.length ? <div><pre>{JSON.stringify(errors)}</pre></div> : null;
AuthErrorsContainer.propTypes = {
  errors: PropTypes.array
};

