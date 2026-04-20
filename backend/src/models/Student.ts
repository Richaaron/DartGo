import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export enum SchoolLevel {
  PRE_NURSERY = 'Pre-Nursery',
  NURSERY = 'Nursery',
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export interface StudentAttributes {
  id: string;
  userId: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  level: SchoolLevel;
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  enrollmentDate: Date;
  status: 'Active' | 'Inactive' | 'Suspended';
  profileImage?: string;
  emergencyContact?: string;
  medicalInfo?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: string;
  public userId!: string;
  public registrationNumber!: string;
  public firstName!: string;
  public lastName!: string;
  public dateOfBirth!: Date;
  public gender!: Gender;
  public level!: SchoolLevel;
  public className!: string;
  public parentName!: string;
  public parentPhone!: string;
  public parentEmail!: string;
  public enrollmentDate!: Date;
  public status!: 'Active' | 'Inactive' | 'Suspended';
  public profileImage?: string;
  public emergencyContact?: string;
  public medicalInfo?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // Associations
  public user?: User;

  // Instance methods
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    registrationNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isBefore: new Date().toISOString(),
      },
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female'),
      allowNull: false,
    },
    level: {
      type: DataTypes.ENUM('Pre-Nursery', 'Nursery', 'Primary', 'Secondary'),
      allowNull: false,
    },
    className: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 20],
      },
    },
    parentName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    parentPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[+]?[\d\s\-\(\)]+$/,
      },
    },
    parentEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    enrollmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
      allowNull: false,
      defaultValue: 'Active',
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    medicalInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['registrationNumber'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['level'],
      },
      {
        fields: ['className'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Student;
