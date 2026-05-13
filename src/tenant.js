
const optionalString = (source, field) => {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new TypeError(`${field} must be a string`);
  }

  return value;
};

export default class Tenant {
  constructor(name, clientId) {
    this.name = optionalString(name, 'name');
    this.clientId = optionalString(clientId, 'clientId');
  }
}
