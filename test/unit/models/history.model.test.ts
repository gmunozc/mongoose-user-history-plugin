import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { HistoryModel, IPluginOptions } from '../../../src/libs/history.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('HistoryModel Creation', () => {
  it('should create a model with the default options', async () => {
    const model = HistoryModel('TestHistory', mongoose.connection);
    expect(model).toBeDefined();
  });

  it('should handle custom options', () => {
    const options: IPluginOptions = {
      diffOnly: true,
      customCollectionName: 'CustomHistory',
    };
    const model = HistoryModel('CustomHistory', mongoose.connection, options);
  });
});
