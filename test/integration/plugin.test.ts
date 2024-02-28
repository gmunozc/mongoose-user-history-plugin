import mongoose from 'mongoose';

describe('saveHistory', () => {
  it('should save history correctly for updates', async () => {
    const mongoose = require('mongoose');
    const { MongoMemoryServer } = require('mongodb-memory-server');

    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const HistorySchema = new mongoose.Schema({
      action: String,
      method: String,
      modelName: String,
      modifiedBy: String,
      collectionName: String,
      oldDocument: Object,
      currentDocument: Object,
    });

    const History = mongoose.model('History', HistorySchema);

    const historyData = {
      action: 'updated',
      method: 'save',
      modelName: 'TestModel',
      modifiedBy: 'someUserId',
      collectionName: 'testmodels',
      oldDocument: { name: 'Old Name' },
      currentDocument: { name: 'New Name' },
    };

    const historyInstance = new History(historyData);
    await historyInstance.save();

    const savedHistory = await History.findOne({ modifiedBy: 'someUserId' });
    expect(savedHistory).toBeTruthy();
    expect(savedHistory.method).toBe('save');

    await mongoose.disconnect();
    await mongoServer.stop();
  });
});
