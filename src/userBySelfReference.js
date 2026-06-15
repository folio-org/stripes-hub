const ROOT = 'UserBySelfReference';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const assertRecord = (value, path) => {
  if (!isRecord(value)) {
    throw new TypeError(`${path} must be an object`);
  }

  return value;
};

const fieldPath = (path, field) => `${path}.${field}`;

const optionalString = (source, field, path) => {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldPath(path, field)} must be a string`);
  }

  return value;
};

const optionalBoolean = (source, field, path) => {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    throw new TypeError(`${fieldPath(path, field)} must be a boolean`);
  }

  return value;
};

const optionalNumber = (source, field, path) => {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number') {
    throw new TypeError(`${fieldPath(path, field)} must be a number`);
  }

  return value;
};

const optionalRecord = (source, field, path) => {
  const value = source[field];
  if (value === undefined || value === null) return undefined;

  return assertRecord(value, fieldPath(path, field));
};

const optionalStringArray = (source, field, path) => {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new TypeError(`${fieldPath(path, field)} must be an array`);
  }

  return value.map((item, index) => {
    if (typeof item !== 'string') {
      throw new TypeError(`${fieldPath(path, field)}[${index}] must be a string`);
    }

    return item;
  });
};

const optionalObjectArray = (source, field, path, SchemaClass) => {
  const value = source[field];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new TypeError(`${fieldPath(path, field)} must be an array`);
  }

  return value.map((item, index) => new SchemaClass(assertRecord(item, `${fieldPath(path, field)}[${index}]`), `${fieldPath(path, field)}[${index}]`));
};

const optionalSchemaObject = (source, field, path, SchemaClass) => {
  const value = optionalRecord(source, field, path);

  return value ? new SchemaClass(value, fieldPath(path, field)) : undefined;
};

const requiredSchemaObject = (source, field, path, SchemaClass) => {
  const value = source[field];
  assertRecord(value, fieldPath(path, field));

  return new SchemaClass(value, fieldPath(path, field));
};

const compactObject = (obj) => Object.entries(obj).reduce((acc, [key, value]) => {
  if (value !== undefined) {
    acc[key] = value;
  }

  return acc;
}, {});

const serialize = (value) => {
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (value && typeof value.toJSON === 'function') {
    return value.toJSON();
  }

  return value;
};

class SchemaObject {
  toJSON() {
    return compactObject(Object.fromEntries(
      Object.entries(this).map(([key, value]) => [key, serialize(value)])
    ));
  }
}

export class Metadata extends SchemaObject {
  constructor(data, path = 'Metadata') {
    super();
    assertRecord(data, path);

    this.createdDate = optionalString(data, 'createdDate', path);
    this.createdByUserId = optionalString(data, 'createdByUserId', path);
    this.createdByUsername = optionalString(data, 'createdByUsername', path);
    this.updatedDate = optionalString(data, 'updatedDate', path);
    this.updatedByUserId = optionalString(data, 'updatedByUserId', path);
    this.updatedByUsername = optionalString(data, 'updatedByUsername', path);
  }
}

export class Tags extends SchemaObject {
  constructor(data, path = 'Tags') {
    super();
    assertRecord(data, path);

    this.tagList = optionalStringArray(data, 'tagList', path);
  }
}

export class Address extends SchemaObject {
  constructor(data, path = 'Address') {
    super();
    assertRecord(data, path);

    this.id = optionalString(data, 'id', path);
    this.countryId = optionalString(data, 'countryId', path);
    this.addressLine1 = optionalString(data, 'addressLine1', path);
    this.addressLine2 = optionalString(data, 'addressLine2', path);
    this.city = optionalString(data, 'city', path);
    this.region = optionalString(data, 'region', path);
    this.postalCode = optionalString(data, 'postalCode', path);
    this.addressTypeId = optionalString(data, 'addressTypeId', path);
    this.primaryAddress = optionalBoolean(data, 'primaryAddress', path);
  }
}

export class Personal extends SchemaObject {
  constructor(data, path = 'Personal') {
    super();
    assertRecord(data, path);

    this.lastName = optionalString(data, 'lastName', path);
    this.firstName = optionalString(data, 'firstName', path);
    this.middleName = optionalString(data, 'middleName', path);
    this.preferredFirstName = optionalString(data, 'preferredFirstName', path);
    this.email = optionalString(data, 'email', path);
    this.pronouns = optionalString(data, 'pronouns', path);
    this.phone = optionalString(data, 'phone', path);
    this.mobilePhone = optionalString(data, 'mobilePhone', path);
    this.dateOfBirth = optionalString(data, 'dateOfBirth', path);
    this.addresses = optionalObjectArray(data, 'addresses', path, Address);
    this.preferredContactTypeId = optionalString(data, 'preferredContactTypeId', path);
    this.profilePictureLink = optionalString(data, 'profilePictureLink', path);
  }
}

export class User extends SchemaObject {
  constructor(data, path = 'User') {
    super();
    assertRecord(data, path);

    this.username = optionalString(data, 'username', path);
    this.id = optionalString(data, 'id', path);
    this.externalSystemId = optionalString(data, 'externalSystemId', path);
    this.barcode = optionalString(data, 'barcode', path);
    this.active = optionalBoolean(data, 'active', path);
    this.type = optionalString(data, 'type', path);
    this.patronGroup = optionalString(data, 'patronGroup', path);
    this.departments = optionalStringArray(data, 'departments', path);
    this.meta = optionalRecord(data, 'meta', path);
    this.proxyFor = optionalStringArray(data, 'proxyFor', path);
    this.personal = optionalSchemaObject(data, 'personal', path, Personal);
    this.enrollmentDate = optionalString(data, 'enrollmentDate', path);
    this.expirationDate = optionalString(data, 'expirationDate', path);
    this.createdDate = optionalString(data, 'createdDate', path);
    this.updatedDate = optionalString(data, 'updatedDate', path);
    this.metadata = optionalSchemaObject(data, 'metadata', path, Metadata);
    this.tags = optionalSchemaObject(data, 'tags', path, Tags);
    this.customFields = optionalRecord(data, 'customFields', path);
    this.preferredEmailCommunication = optionalStringArray(data, 'preferredEmailCommunication', path);
  }
}

export class PatronGroup extends SchemaObject {
  constructor(data, path = 'PatronGroup') {
    super();
    assertRecord(data, path);

    this.group = optionalString(data, 'group', path);
    this.desc = optionalString(data, 'desc', path);
    this.id = optionalString(data, 'id', path);
    this.metadata = optionalSchemaObject(data, 'metadata', path, Metadata);
  }
}

export class Permissions extends SchemaObject {
  constructor(data, path = 'Permissions') {
    super();
    assertRecord(data, path);

    const permissions = data.permissions;
    if (permissions !== undefined && permissions !== null && !Array.isArray(permissions)) {
      throw new TypeError(`${fieldPath(path, 'permissions')} must be an array`);
    }

    this.id = optionalString(data, 'id', path);
    this.userId = optionalString(data, 'userId', path);
    this.permissions = permissions?.map((permission, index) => {
      if (typeof permission === 'string') {
        return permission;
      }

      return assertRecord(permission, `${fieldPath(path, 'permissions')}[${index}]`);
    });
    this.metadata = optionalSchemaObject(data, 'metadata', path, Metadata);
  }
}

export class ProxyFor extends SchemaObject {
  constructor(data, path = 'ProxyFor') {
    super();
    assertRecord(data, path);

    this.userId = optionalString(data, 'userId', path);
    this.proxyUserId = optionalString(data, 'proxyUserId', path);
    this.id = optionalString(data, 'id', path);
    this.requestForSponsor = optionalString(data, 'requestForSponsor', path);
    this.createdDate = optionalString(data, 'createdDate', path);
    this.notificationsTo = optionalString(data, 'notificationsTo', path);
    this.accrueTo = optionalString(data, 'accrueTo', path);
    this.status = optionalString(data, 'status', path);
    this.expirationDate = optionalString(data, 'expirationDate', path);
    this.metadata = optionalSchemaObject(data, 'metadata', path, Metadata);
  }
}

export class StaffSlip extends SchemaObject {
  constructor(data, path = 'StaffSlip') {
    super();
    assertRecord(data, path);

    this.id = optionalString(data, 'id', path);
    this.printByDefault = optionalBoolean(data, 'printByDefault', path);
  }
}

export class ServicePoint extends SchemaObject {
  constructor(data, path = 'ServicePoint') {
    super();
    assertRecord(data, path);

    this.id = optionalString(data, 'id', path);
    this.name = optionalString(data, 'name', path);
    this.code = optionalString(data, 'code', path);
    this.discoveryDisplayName = optionalString(data, 'discoveryDisplayName', path);
    this.description = optionalString(data, 'description', path);
    this.shelvingLagTime = optionalNumber(data, 'shelvingLagTime', path);
    this.pickupLocation = optionalBoolean(data, 'pickupLocation', path);
    this.staffSlips = optionalObjectArray(data, 'staffSlips', path, StaffSlip);
    this.locationIds = optionalStringArray(data, 'locationIds', path);
    this.metadata = optionalSchemaObject(data, 'metadata', path, Metadata);
  }
}

export class ServicePointsUser extends SchemaObject {
  constructor(data, path = 'ServicePointsUser') {
    super();
    assertRecord(data, path);

    this.id = optionalString(data, 'id', path);
    this.userId = optionalString(data, 'userId', path);
    this.servicePointsIds = optionalStringArray(data, 'servicePointsIds', path);
    this.servicePoints = optionalObjectArray(data, 'servicePoints', path, ServicePoint);
    this.defaultServicePointId = optionalString(data, 'defaultServicePointId', path);
    this.defaultServicePoint = optionalSchemaObject(data, 'defaultServicePoint', path, ServicePoint);
    this.metadata = optionalSchemaObject(data, 'metadata', path, Metadata);
  }
}

export default class UserBySelfReference extends SchemaObject {
  constructor(data, path = ROOT) {
    super();
    assertRecord(data, path);

    this.user = requiredSchemaObject(data, 'user', path, User);
    this.patronGroup = optionalSchemaObject(data, 'patronGroup', path, PatronGroup);
    this.permissions = optionalSchemaObject(data, 'permissions', path, Permissions);
    this.proxiesFor = optionalObjectArray(data, 'proxiesFor', path, ProxyFor);
    this.servicePointsUser = optionalSchemaObject(data, 'servicePointsUser', path, ServicePointsUser);
    this.originalTenantId = optionalString(data, 'originalTenantId', path);
  }

  static fromJSON(data) {
    return new UserBySelfReference(data);
  }
}
