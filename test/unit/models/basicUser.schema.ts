import { Schema, Document, model } from 'mongoose';
import mongooseHistoryPlugin, { initializeDefaultSchema } from '../../../src/index';

interface IUser extends Document {
  fullName: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  fullName: { type: String },
  username: { type: String },
  email: { type: String },
  password: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.plugin(mongooseHistoryPlugin);

UserSchema.pre<IUser>('save', function (next) {
  if (this.isModified('password')) {
    this.password = hashPassword(this.password);
  }
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

const UserModel = model<IUser>('User', UserSchema);

export default UserModel;

function hashPassword(password: string): string {
  return password;
}
