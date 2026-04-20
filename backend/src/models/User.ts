import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum UserRole {
  ADMIN = 'Admin',
  TEACHER = 'Teacher',
  STUDENT = 'Student',
  PARENT = 'Parent',
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  SUSPENDED = 'Suspended',
}

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  emailVerified: boolean;
  phone?: string;
  address?: string;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: UserRole;
  public status!: UserStatus;
  public lastLogin?: Date;
  public emailVerified!: boolean;
  public phone?: string;
  public address?: string;
  public profileImage?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // Instance methods
  public toJSON(): UserAttributes {
    const values = { ...this.get({ plain: true }) };
    delete values.password;
    return values;
  }

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Teacher', 'Student', 'Parent'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
      allowNull: false,
      defaultValue: 'Active',
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[+]?[\d\s\-\(\)]+$/,
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    paranoid: true, // Soft deletes
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

// Hooks
User.addHook('beforeCreate', async (user: User) => {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  user.password = await bcrypt.hash(user.password, saltRounds);
});

User.addHook('beforeUpdate', async (user: User) => {
  if (user.changed('password')) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

export default User;
