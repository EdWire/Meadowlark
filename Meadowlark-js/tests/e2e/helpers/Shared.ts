// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import Chance from 'chance';
import memoize from 'fast-memoize';
import request, { SuperTest, Test } from 'supertest';
import { getAccessToken } from './Credentials';

const chance = new Chance() as Chance.Chance;

function getBaseURLRequest() {
  return request(process.env.BASE_URL);
}

function getRootURLRequest() {
  return request(process.env.ROOT_URL);
}

export const baseURLRequest: () => SuperTest<Test> = memoize(getBaseURLRequest);
export const rootURLRequest: () => SuperTest<Test> = memoize(getRootURLRequest);

export function generateRandomId(length = 12): string {
  return chance.hash({ length });
}

export function generateGuid(): string {
  return chance.guid();
}

export async function getDescriptorByLocation(location: string): Promise<string> {
  return rootURLRequest()
    .get(location)
    .auth(await getAccessToken('Host'), { type: 'bearer' })
    .expect(200)
    .then((response) => {
      expect(response.body).not.toBe(null);
      return `${response.body.namespace}#${response.body.description}`;
    });
}