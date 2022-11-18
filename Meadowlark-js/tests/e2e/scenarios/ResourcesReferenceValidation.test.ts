// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { getAccessToken } from '../helpers/Credentials';
import { createSchool } from '../helpers/DataCreation';
import { createResource, deleteResourceByLocation } from '../helpers/Resources';
import { baseURLRequest, rootURLRequest } from '../helpers/Shared';

describe('When creating a resource that has a reference to another resource', () => {
  describe('given a token with strict validation', () => {
    describe('given reference does not exist', () => {
      it('should fail with code 400 and a message', async () => {
        await baseURLRequest()
          .post('/v3.3b/ed-fi/locations')
          .auth(await getAccessToken('Vendor'), { type: 'bearer' })
          .send({
            classroomIdentificationCode: 'string',
            schoolReference: {
              schoolId: 99,
            },
            maximumNumberOfSeats: 20,
            optimalNumberOfSeats: 10,
          })
          .expect(400)
          .then((response) => {
            expect(response.body.message).toContain('Resource School is missing identity');
          });
      });
    });

    describe('given the reference does exist', () => {
      let schoolId: number;
      let schoolLocation: string;
      let location: string;

      beforeAll(async () => {
        schoolId = 100;
        schoolLocation = await createSchool(schoolId);
      });

      it('accepts the request', async () => {
        location = await createResource({
          endpoint: 'locations',
          body: {
            classroomIdentificationCode: 'string',
            schoolReference: {
              schoolId,
            },
            maximumNumberOfSeats: 20,
            optimalNumberOfSeats: 10,
          },
        });

        await rootURLRequest()
          .get(location)
          .auth(await getAccessToken('Vendor'), { type: 'bearer' })
          .expect(200);
      });

      afterAll(async () => {
        await deleteResourceByLocation(location);

        await deleteResourceByLocation(schoolLocation);
      });
    });
  });

  describe('given a token with relaxed validation', () => {
    let location: string;

    it('should add the location', async () => {
      location = await createResource({
        endpoint: 'locations',
        credentials: 'Host',
        body: {
          classroomIdentificationCode: 'string',
          schoolReference: {
            schoolId: 99,
          },
          maximumNumberOfSeats: 20,
          optimalNumberOfSeats: 10,
        },
      });

      await rootURLRequest()
        .get(location)
        .auth(await getAccessToken('Host'), { type: 'bearer' })
        .expect(200)
        .then((response) => {
          expect(response.body).toEqual(
            expect.objectContaining({
              schoolReference: {
                schoolId: 99,
              },
            }),
          );
        });
    });

    afterAll(async () => {
      await deleteResourceByLocation(location);
    });
  });
});