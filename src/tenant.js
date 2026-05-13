
const optionalString = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new TypeError(`${value} must be a string`);
  }

  return value;
};

export default class Tenant {
  constructor(name, clientId) {
    this.name = optionalString(name);
    this.clientId = optionalString(clientId);
  }
}
