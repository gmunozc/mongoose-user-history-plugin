import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from './basicUser.schema';
import { initializeDefaultSchema } from '../../../src/index';

jest.mock('request-context', () => {
  const actualContextService = jest.requireActual('request-context');
  let context = {};
  return {
    ...actualContextService,
    get: jest.fn((path) => context[path]),
    set: jest.fn((path, value) => {
      context[path] = value;
    }),
    middleware: jest.fn(() => (req, res, next) => next()),
  };
});

let mongod: MongoMemoryServer;
let HistoryModel: mongoose.Model<any>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  mongoose.set('debug', false);

  // Mocked user info, you could change this to be dynamic if needed
  const mockUserId = new Types.ObjectId();
  const contextService = require('request-context');
  contextService.set('request:userInfo', { _id: mockUserId });

  // Initialize the history model with the current Mongoose connection
  HistoryModel = initializeDefaultSchema({
    connection: mongoose.connection,
    options: {
      // Configuration options, if any
    },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('User Model with History Plugin', () => {
  it('should create, update, and delete a user and record history', async () => {
    // Create user
    let newUser = await UserModel.create({ fullName: 'John Doe', email: 'john@example.com' });
    expect(newUser).toBeDefined();
    expect(newUser.fullName).toBe('John Doe');

    // Create user
    const toUpdatedUser = await UserModel.create({
      fullName: 'John Doe',
      email: 'john@example.com',
    });
    expect(toUpdatedUser).toBeDefined();
    expect(newUser.fullName).toBe('John Doe');

    // Update user
    const updatedUser = await UserModel.findByIdAndUpdate(
      toUpdatedUser._id,
      { fullName: 'Jane Doe' },
      { new: true }
    );
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.fullName).toBe('Jane Doe');

    // findOneAndUpdate user
    const updatedUser3 = await UserModel.findOneAndUpdate(
      { _id: toUpdatedUser._id },
      { $set: { fullName: 'Jane Doe' } }
    );
    expect(updatedUser3).toBeDefined();
    expect(updatedUser3?.fullName).toBe('Jane Doe');

    // updateMany user
    const updatedUser4 = await UserModel.updateMany(
      { _id: toUpdatedUser._id },
      { $set: { fullName: 'Jane Doe' } }
    );
    expect(updatedUser4).toBeDefined();
    // expect(updatedUser4?.fullName).toBe('Jane Doe');

    // updateOne user
    const updatedUser5 = await UserModel.updateOne(
      { _id: toUpdatedUser._id },
      { $set: { fullName: 'Jane Doe' } }
    );
    expect(updatedUser5).toBeDefined();
    // expect(updatedUser5?.fullName).toBe('Jane Doe');

    // Delete user
    await UserModel.deleteOne({ _id: newUser._id });

    const histories = await HistoryModel.find({});
    console.log({ histories: JSON.stringify(histories) });
    expect(histories.length).toBeGreaterThan(0);
  });
});
