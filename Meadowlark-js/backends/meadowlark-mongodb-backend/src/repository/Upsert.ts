// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { Collection, ClientSession, MongoClient } from 'mongodb';
import { UpsertResult, Logger, UpsertRequest } from '@edfi/meadowlark-core';
import { MeadowlarkDocument } from '../model/MeadowlarkDocument';
import { getCollection } from './Db';
import { asUpsert, meadowlarkDocumentFrom, onlyReturnId, validateReferences } from './WriteHelper';

export async function upsertDocument(
  { resourceInfo, documentInfo, id, edfiDoc, validate, traceId, security }: UpsertRequest,
  client: MongoClient,
): Promise<UpsertResult> {
  const document: MeadowlarkDocument = meadowlarkDocumentFrom(
    resourceInfo,
    documentInfo,
    id,
    edfiDoc,
    validate,
    security.clientName,
  );

  const mongoCollection: Collection<MeadowlarkDocument> = getCollection(client);
  const session: ClientSession = client.startSession();

  let upsertResult: UpsertResult = { response: 'UNKNOWN_FAILURE' };

  try {
    await session.withTransaction(async () => {
      if (validate) {
        const failures = await validateReferences(
          documentInfo.documentReferences,
          documentInfo.descriptorReferences,
          document.outRefs,
          mongoCollection,
          session,
          traceId,
        );

        // Abort on validation failure
        if (failures.length > 0) {
          Logger.debug(
            `mongodb.repository.Upsert.upsertDocument: Upserting document id ${id} failed due to invalid references`,
            traceId,
          );

          // Check whether this would have been an insert or update
          const isInsert: boolean = (await mongoCollection.findOne({ id }, onlyReturnId(session))) == null;

          upsertResult = {
            response: isInsert ? 'INSERT_FAILURE_REFERENCE' : 'UPDATE_FAILURE_REFERENCE',
            failureMessage: `Reference validation failed: ${failures.join(',')}`,
          };

          await session.abortTransaction();
          return;
        }
      }

      // Perform the document upsert
      Logger.debug(`mongodb.repository.Upsert.upsertDocument: Upserting document id ${id}`, traceId);

      const { upsertedCount } = await mongoCollection.replaceOne({ id }, document, asUpsert(session));
      upsertResult.response = upsertedCount === 0 ? 'UPDATE_SUCCESS' : 'INSERT_SUCCESS';
    });
  } catch (e) {
    Logger.error('mongodb.repository.Upsert.upsertDocument', traceId, e);

    return { response: 'UNKNOWN_FAILURE', failureMessage: e.message };
  } finally {
    await session.endSession();
  }

  return upsertResult;
}