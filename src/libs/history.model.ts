/**
 * @fileoverview
 * This file contains the definition of the HistoryModel and initializeDefaultSchema functions,
 * as well as the IPluginOptions and IChangeHistory interfaces.
 */

import mongoose, { Schema, Document, IndexDefinition } from 'mongoose';

/*
 * Metadata options for the history model.
 */
interface IMetadataOption {
  key: string;
  value: string | ((original: any, newObject: any) => any);
  schema?: Schema;
}

/**
 * Options for configuring the HistoryModel.
 */
interface IPluginOptions {
  diffOnly?: boolean;
  customCollectionName?: string;
  indexes?: IndexDefinition[];
  omitPaths?: string[];
  keepNewKeys?: boolean;
  metadata?: IMetadataOption[];
  modifiedBy?: {
    schemaType: any;
    contextPath: string;
  };
}

/**
 * Represents a change history document.
 */
interface IChangeHistory extends Document {
  collectionName: string;
  modelName: string;
  documentId: string;
  modifiedBy: any;
  changes: object;
  oldDocument: object;
  currentDocument: object;
  action: string;
  method: string;
  createdAt: Date;
}

/**
 * Creates a Mongoose model for storing change history.
 * @param collectionName - The name of the collection to store the change history.
 * @param connection - The Mongoose connection object.
 * @param options - Optional configuration options for the model.
 * @returns The Mongoose model for change history.
 */
const HistoryModel = function (
  collectionName: string,
  connection: mongoose.Connection,
  options?: IPluginOptions
) {
  const { indexes, metadata, modifiedBy } = options ?? {};

  const schemaObject: Record<string, any> = {
    collectionName: { type: String, required: false },
    modelName: { type: String, required: false },
    documentId: { type: Schema.Types.ObjectId, required: false },
    action: { type: String, required: false },
    method: { type: String, required: false },
    changes: { type: Schema.Types.Mixed, required: false },
    oldDocument: { type: Schema.Types.Mixed, required: false },
    currentDocument: { type: Schema.Types.Mixed, required: false },
    modifiedBy: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  };

  // Apply metadata if they are provided in the options
  if (options?.metadata) {
    for (const meta of options.metadata) {
      schemaObject[meta.key] = meta.schema || { type: mongoose.Schema.Types.Mixed };
    }
  }

  // Apply modifiedBy if they are provided in the options
  if (modifiedBy?.schemaType) {
    schemaObject.modifiedBy = { type: modifiedBy.schemaType };
  }

  const ChangeHistorySchema: Schema = new Schema(schemaObject);

  // Apply indexes if they are provided in the options
  if (options?.indexes) {
    for (const index of options.indexes) {
      ChangeHistorySchema.index(index);
    }
  }

  const ChangeHistory = connection.model<IChangeHistory>(collectionName, ChangeHistorySchema);
  return ChangeHistory;
};

/**
 * Initializes the default change history schema.
 * @param connection - The Mongoose connection object.
 * @param options - Optional configuration options for the model.
 * @returns The Mongoose model for change history.
 */
const initializeDefaultSchema = ({
  connection,
  options,
}: {
  connection: mongoose.Connection;
  options?: IPluginOptions;
}) => {
  const { customCollectionName } = options ?? {};
  const collectionName = customCollectionName || 'History';
  if (!(collectionName in connection.models)) {
    return HistoryModel(collectionName, connection, options);
  }
  return connection.models[collectionName];
};

export { IPluginOptions, IChangeHistory, HistoryModel, initializeDefaultSchema };
export default HistoryModel;
