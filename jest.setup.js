const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
});

afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});
