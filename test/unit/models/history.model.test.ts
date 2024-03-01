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

  // Inicializar el modelo de historial con la conexión de Mongoose actual
  HistoryModel = initializeDefaultSchema({
    connection: mongoose.connection,
    options: {
      // Opciones de configuración, si las hay
    },
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('User Model with History Plugin', () => {
  // Aplica el plugin al modelo de usuario aquí si no se ha aplicado globalmente
  // beforeAll(() => {
  //   UserModel.schema.plugin(mongooseHistoryPlugin);
  // });

  it('should create, update, and delete a user and record history', async () => {
    // Crear usuario
    let newUser = await UserModel.create({ fullName: 'John Doe', email: 'john@example.com' });
    expect(newUser).toBeDefined();
    expect(newUser.fullName).toBe('John Doe');

    // Crear usuario
    const toUpdatedUser = await UserModel.create({
      fullName: 'John Doe',
      email: 'john@example.com',
    });
    expect(toUpdatedUser).toBeDefined();
    expect(newUser.fullName).toBe('John Doe');

    // Actualizar usuario
    const updatedUser = await UserModel.findByIdAndUpdate(
      toUpdatedUser._id,
      { fullName: 'Jane Doe' },
      { new: true }
    );
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.fullName).toBe('Jane Doe');

    await UserModel.deleteOne({ _id: newUser._id });

    // Verificar historial (Este paso depende de cómo accedas a la colección de historial)
    // Puedes usar algo como HistoryModel.find() si tienes un modelo para la colección de historial
    const histories = await HistoryModel.find({});
    console.log({ histories: JSON.stringify(histories) });
    expect(histories.length).toBeGreaterThan(0);
  });
});
