export const OrganizationLogo = ({ branding }) => <img src={branding.logo.src} alt={branding.logo.alt} width="300px" />;
export const SelectAndDispatchTenant = () => { };
export const FieldLabel = (props) => {
  const { children, ...rest } = props;
  return <label htmlFor={props.htmlFor} {...rest}>{children}</label>;
}
export const Headline = ({ children }) => <h1>{children}</h1>;
export const Row = ({ children }) => <div>{children}</div>;
export const Col = ({ children }) => <span>{children}</span>;
export const Select = (props) => {
  const { children, dataOptions, readOnly, ...rest } = props;
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
export const TextField = (props) => <input {...props.input} />;
export const Button = (props) => {
   const { buttonClass, buttonRef, css, children, disabled, onClick, to, type, ref } = props;
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
export const AuthErrorsContainer = ({ errors }) => errors.length ? <div><pre>{JSON.stringify(errors)}</pre></div> : null;
