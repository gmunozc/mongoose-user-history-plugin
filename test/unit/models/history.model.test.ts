import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import UserModel from './basicUser.schema';
import { initializeDefaultSchema } from '../../../src/index';

let mongod: MongoMemoryServer;
let HistoryModel: mongoose.Model<any>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  mongoose.set('debug', false);

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

    // Delete user
    await UserModel.deleteOne({ _id: newUser._id });

    const histories = await HistoryModel.find({});
    console.log({ histories: JSON.stringify(histories) });
    expect(histories.length).toBeGreaterThan(0);
  });
});
