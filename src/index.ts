import mongoose, { FilterQuery, Query, Schema, Types } from 'mongoose';
import deepDiff, { arrayEquals } from './libs/deep-diff';
import { HistoryModel, IPluginOptions, initializeDefaultSchema } from './libs/history.model';
import contextService from 'request-context';

interface IDocumentMethods {
  _original: any;
  normalizeObjectWithModel(data: any): mongoose.Document;
  getModelFromThis(): mongoose.Model<mongoose.Document>;
}

interface ICustomDocument extends Document, IDocumentMethods {}

interface IUpdateQuery {
  $set?: Record<string, any>;
  $unset?: Record<string, any>;
}

interface QueryWithOp<
  ResultType = any,
  DocType = any,
  THelpers = Record<string, any>,
  RawDocType = DocType,
  QueryOp = any,
> extends mongoose.Query<ResultType, DocType, THelpers, RawDocType, QueryOp> {
  op: string;
}

interface IStaticMethods {
  clearHistory(callback: (err?: any) => void): void;
}

function HistoryPlugin<T extends mongoose.Document<any, any, any>>(
  schema: mongoose.Schema,
  options?: IPluginOptions
) {
  options = {
    diffOnly: false,
    modifiedBy: {
      contextPath: 'request:userInfo',
      schemaType: Types.ObjectId,
    },
    ...options,
  };
  const addUserWhoModifies = options.modifiedBy;

  let modifiedBy = null;

  // Generate object from current schema
  schema.methods.normalizeObjectWithModel = function (data: any): mongoose.Document {
    const Model = this.constructor;
    delete data._id;
    const newObj = new Model(data);
    return newObj.toObject();
  };

  // Get model from current schema
  schema.methods.getModelFromThis = function (): mongoose.Model<mongoose.Document> {
    return this.constructor;
  };

  // Clear all history documents from history collection
  schema.statics.clearHistory = function (callback) {
    callback = callback || function () {};
  };

  schema.pre('save', async function (this: T & ICustomDocument, next): Promise<void> {
    const doc = this;
    const { collectionName } = doc.collection;
    const { modelName } = doc.constructor as any;
    const connection = doc.db;
    let action = 'undefined';
    const method = 'save';

    modifiedBy = contextService.get(addUserWhoModifies.contextPath);

    const currentDocument = this.normalizeObjectWithModel(doc.toObject());
    let oldDocument: any = {};

    if (this.isNew) {
      action = 'created';
    } else {
      action = 'updated';
      oldDocument = await this.getModelFromThis()
        .findOne({
          _id: this._id,
        })
        .lean();
      oldDocument = this.normalizeObjectWithModel(oldDocument ?? {});
    }

    await saveHistory({
      action,
      method,
      oldDocument,
      currentDocument,
      modelName,
      modifiedBy,
      collectionName,
      connection,
      options,
    });
    next();
  });

  schema.pre<Query<any, Document>>(/deleteOne|remove/, async function (this: QueryWithOp, next) {
    const queryConditions: FilterQuery<any> = this.getQuery();
    const {
      modelName,
      collection: { collectionName },
      db: connection,
    } = this.model;
    const action = 'deleted';
    const method = this.op; // 'deleteOne' o 'remove'

    modifiedBy = contextService.get(addUserWhoModifies.contextPath);

    const oldDocument = await this.model.findOne(queryConditions).clone().lean();

    if (oldDocument) {
      await saveHistory({
        action,
        method,
        modelName,
        modifiedBy,
        collectionName,
        oldDocument,
        currentDocument: {},
        connection,
        options,
      });
    }

    next();
  });

  schema.pre(/deleteMany/, async function (this: QueryWithOp, next) {
    const queryConditions: FilterQuery<any> = this.getQuery();
    const {
      modelName,
      collection: { collectionName },
      db: connection,
    } = this.model;
    // const action = 'deleted';
    const method = 'deleteMany';

    modifiedBy = contextService.get(addUserWhoModifies.contextPath);

    console.log({ modelName, action: method, queryConditions, modifiedBy });

    /*await saveHistory({
      action,
      method,
      modelName,
      modifiedBy,
      collectionName,
      connection,
      options,
    });*/

    next();
  });

  schema.pre(/remove/, { document: false, query: true }, async function (next) {
    next();
  });

  schema.post(
    /findOneAndRemove|findByIdAndRemove|findByIdAndDelete|findOneAndDelete/,
    async function (doc, next) {
      next();
    }
  );

  schema.post(/insertMany/, async function (this: QueryWithOp, docs, next) {
    const {
      modelName,
      collection: { collectionName },
      db: connection,
    } = this.model;
    const action = 'created';
    const method = 'insertMany';

    modifiedBy = contextService.get(addUserWhoModifies.contextPath);

    for (const doc of docs) {
      const currentDocument = doc.toObject();

      await saveHistory({
        action,
        method,
        modelName,
        modifiedBy,
        collectionName,
        currentDocument,
        oldDocument: {},
        connection,
        options,
      });
    }

    next();
  });

  schema.pre(/update|updateMany/, async function (this: QueryWithOp, next) {
    const queryConditions: FilterQuery<any> = this.getQuery();
    const updateOperation: IUpdateQuery = this.getUpdate() as IUpdateQuery;
    const {
      modelName,
      collection: { collectionName },
      db: connection,
    } = this.model;
    // const action = 'updated';
    const method = this.op; // 'updateMany' o 'update'

    modifiedBy = contextService.get(addUserWhoModifies.contextPath);

    console.log({ modelName, action: method, queryConditions, updateOperation, modifiedBy });

    /*await saveHistory({
      action,
      modelName,
      modifiedBy,
      collectionName,
      connection,
      queryConditions, // Condiciones de la consulta que selecciona el/los documento(s) para actualizar
      updateOperation, // Operación de actualización aplicada
    });*/

    next();
  });

  schema.pre<Query<any, Document>>(
    /updateOne|findOneAndUpdate|findByIdAndUpdate|findOneAndReplace|replaceOne/,
    async function (this: QueryWithOp, next): Promise<void> {
      const queryConditions: FilterQuery<any> = this.getQuery();
      const {
        modelName,
        collection: { collectionName },
        db: connection,
      } = this.model;
      const updateQuery: IUpdateQuery = this.getUpdate() as IUpdateQuery;
      const action = 'updated';
      const method = this.op;

      modifiedBy = contextService.get(addUserWhoModifies.contextPath);

      const oldDocument = await this.findOne(queryConditions).clone();
      const oldDocumentObject = oldDocument.toObject();
      const currentDocument = oldDocument.normalizeObjectWithModel({
        ...oldDocumentObject,
        ...updateQuery.$set,
        ...updateQuery.$unset,
      });

      await saveHistory({
        action,
        method,
        modelName,
        modifiedBy,
        collectionName,
        currentDocument,
        oldDocument: oldDocumentObject,
        connection,
        options,
      });

      next();
    }
  );
}

// Save history document
function saveHistory({
  action,
  method,
  modelName,
  modifiedBy,
  collectionName,
  oldDocument,
  currentDocument,
  connection,
  options,
}: {
  action: string;
  method: string;
  modelName: string;
  modifiedBy: any;
  collectionName: string;
  oldDocument: any;
  currentDocument: any;
  connection: mongoose.Connection;
  options?: IPluginOptions;
}): Promise<void> {
  const changes = deepDiff({
    currentDocument,
    oldDocument,
    omitPaths: options?.omitPaths,
    keepNewKeys: options?.keepNewKeys,
  });
  if (changes) {
    const history = initializeDefaultSchema({ connection, options });
    return new history({
      action,
      method,
      modifiedBy,
      documentId: oldDocument?._id ?? null,
      modelName,
      collectionName,
      oldDocument: options?.diffOnly ? undefined : oldDocument,
      currentDocument: options?.diffOnly ? undefined : currentDocument,
      changes,
    }).save();
  }
  return Promise.resolve();
}

export { deepDiff, arrayEquals, initializeDefaultSchema, HistoryModel, IPluginOptions };
export default HistoryPlugin;
