// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import querystring from 'node:querystring';
import {
  createClient,
  createSigningKey,
  getClientById,
  getClients,
  requestToken,
  resetAuthorizationClientSecret,
  updateClient,
  verifyToken,
} from '@edfi/meadowlark-authz-server';
import type { AuthorizationRequest } from '@edfi/meadowlark-authz-server';
import { FastifyReply, FastifyRequest } from 'fastify';
import { mapKeys } from 'lodash';
import { respondWith, fromRequest } from './AuthorizationConverter';

export async function createAuthorizationClientHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await createClient(fromRequest(request)), reply);
}

export async function updateAuthorizationClientHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await updateClient(fromRequest(request)), reply);
}

export async function requestTokenAuthorizationHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authorizationRequest: AuthorizationRequest = fromRequest(request);

  if (authorizationRequest.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) {
    let authorizationRequestWwwForm: any;
    try {
      authorizationRequestWwwForm = querystring.parse(authorizationRequest.body as string);
      // @ts-ignore
      authorizationRequestWwwForm = mapKeys(authorizationRequestWwwForm, (v: string, k: string) => k.toLowerCase());
      const queryString = querystring.stringify(authorizationRequestWwwForm);
      authorizationRequest.body = queryString;
    } catch (error) {
      /* empty */
    }
  } else {
    let authorizationRequestJson: JSON;
    try {
      authorizationRequestJson = JSON.parse(authorizationRequest.body as string);
      // @ts-ignore
      const authorizationRequestJsonFormatted: JSON = mapKeys(authorizationRequestJson, (v: string, k: string) =>
        k.toLowerCase(),
      );
      const jsonFormattedString: string = JSON.stringify(authorizationRequestJsonFormatted);
      authorizationRequest.body = jsonFormattedString;
    } catch (error) {
      /* empty */
    }
  }

  respondWith(await requestToken(authorizationRequest), reply);
}

export async function verifyTokenAuthorizationHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await verifyToken(fromRequest(request)), reply);
}

export async function resetAuthorizationClientSecretHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await resetAuthorizationClientSecret(fromRequest(request)), reply);
}

export async function createSigningKeyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await createSigningKey(fromRequest(request)), reply);
}

export async function getClientByIdHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await getClientById(fromRequest(request)), reply);
}

export async function getClientsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  respondWith(await getClients(fromRequest(request)), reply);
}
