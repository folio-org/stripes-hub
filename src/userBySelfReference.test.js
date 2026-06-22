import UserBySelfReference, {
  Address,
  Metadata,
  Permissions,
  ServicePoint,
  ServicePointsUser,
  User,
} from './userBySelfReference';

describe('UserBySelfReference', () => {
  const metadata = {
    createdDate: '2019-08-24T14:15:22Z',
    createdByUserId: '4d2aef9a-17b0-44e6-902e-616812033620',
    createdByUsername: 'string',
    updatedDate: '2019-08-24T14:15:22Z',
    updatedByUserId: 'b38eaad7-8efa-49e7-b0aa-619916a3821e',
    updatedByUsername: 'string',
  };

  const data = {
    user: {
      username: 'string',
      id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
      externalSystemId: 'string',
      barcode: 'string',
      active: true,
      type: 'string',
      patronGroup: 'eb001005-6661-42d5-8ba7-00bd0866bea0',
      departments: ['497f6eca-6276-4993-bfeb-53cbbbba6f08'],
      meta: {},
      proxyFor: ['string'],
      personal: {
        lastName: 'string',
        firstName: 'string',
        middleName: 'string',
        preferredFirstName: 'string',
        email: 'string',
        pronouns: 'string',
        phone: 'string',
        mobilePhone: 'string',
        dateOfBirth: '2019-08-24T14:15:22Z',
        addresses: [{
          id: 'string',
          countryId: 'string',
          addressLine1: 'string',
          addressLine2: 'string',
          city: 'string',
          region: 'string',
          postalCode: 'string',
          addressTypeId: 'b4b5657e-1710-432d-b2f1-e072418fff5c',
          primaryAddress: true,
        }],
        preferredContactTypeId: 'string',
        profilePictureLink: 'http://example.com',
      },
      enrollmentDate: '2019-08-24T14:15:22Z',
      expirationDate: '2019-08-24T14:15:22Z',
      createdDate: '2019-08-24T14:15:22Z',
      updatedDate: '2019-08-24T14:15:22Z',
      metadata,
      tags: {
        tagList: ['string'],
      },
      customFields: {},
      preferredEmailCommunication: ['Support'],
    },
    patronGroup: {
      group: 'string',
      desc: 'string',
      id: 'string',
      metadata,
    },
    permissions: {
      id: 'string',
      userId: 'string',
      permissions: [{ permissionName: 'users.item.get' }],
      metadata,
    },
    proxiesFor: [{
      userId: 'string',
      proxyUserId: 'string',
      id: 'string',
      requestForSponsor: 'string',
      createdDate: '2019-08-24T14:15:22Z',
      notificationsTo: 'string',
      accrueTo: 'string',
      status: 'string',
      expirationDate: '2019-08-24T14:15:22Z',
      metadata,
    }],
    servicePointsUser: {
      id: 'string',
      userId: 'string',
      servicePointsIds: ['string'],
      servicePoints: [{
        id: 'string',
        name: 'string',
        code: 'string',
        discoveryDisplayName: 'string',
        description: 'string',
        shelvingLagTime: 0,
        pickupLocation: true,
        staffSlips: [{
          id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
          printByDefault: true,
        }],
        locationIds: ['497f6eca-6276-4993-bfeb-53cbbbba6f08'],
        metadata,
      }],
      defaultServicePointId: 'string',
      defaultServicePoint: {
        id: 'string',
        name: 'string',
        code: 'string',
        discoveryDisplayName: 'string',
        description: 'string',
        shelvingLagTime: 0,
        pickupLocation: true,
        staffSlips: [{
          id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
          printByDefault: true,
        }],
        locationIds: ['497f6eca-6276-4993-bfeb-53cbbbba6f08'],
        metadata,
      },
      metadata,
    },
    originalTenantId: 'string',
  };

  it('binds parsed JSON to schema classes', () => {
    const bound = new UserBySelfReference(data);

    expect(bound.user).toBeInstanceOf(User);
    expect(bound.user.metadata).toBeInstanceOf(Metadata);
    expect(bound.user.personal.addresses[0]).toBeInstanceOf(Address);
    expect(bound.permissions).toBeInstanceOf(Permissions);
    expect(bound.servicePointsUser).toBeInstanceOf(ServicePointsUser);
    expect(bound.servicePointsUser.defaultServicePoint).toBeInstanceOf(ServicePoint);
  });

  it('serializes back to plain JSON', () => {
    expect(new UserBySelfReference(data).toJSON()).toEqual(data);
    expect(UserBySelfReference.fromJSON(data).toJSON()).toEqual(data);
  });

  it('preserves legacy string permission entries', () => {
    expect(new UserBySelfReference({
      user: { id: '497f6eca-6276-4993-bfeb-53cbbbba6f08' },
      permissions: { permissions: ['users.item.get'] },
    }).toJSON()).toEqual({
      user: { id: '497f6eca-6276-4993-bfeb-53cbbbba6f08' },
      permissions: { permissions: ['users.item.get'] },
    });
  });

  it('omits absent optional fields', () => {
    expect(new UserBySelfReference({
      user: { id: '497f6eca-6276-4993-bfeb-53cbbbba6f08' },
    }).toJSON()).toEqual({
      user: { id: '497f6eca-6276-4993-bfeb-53cbbbba6f08' },
    });
  });

  it('throws for invalid known field types', () => {
    expect(() => new UserBySelfReference({
      user: { active: 'true' },
    })).toThrow('UserBySelfReference.user.active must be a boolean');

    expect(() => new UserBySelfReference({
      user: { departments: [1] },
    })).toThrow('UserBySelfReference.user.departments[0] must be a string');

    expect(() => new UserBySelfReference({
      user: { id: '497f6eca-6276-4993-bfeb-53cbbbba6f08' },
      servicePointsUser: {
        servicePoints: [{ pickupLocation: 'true' }],
      },
    })).toThrow('UserBySelfReference.servicePointsUser.servicePoints[0].pickupLocation must be a boolean');
  });
});
