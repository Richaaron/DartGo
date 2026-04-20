import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum SubjectCategory {
  CORE = 'CORE',
  ELECTIVE = 'ELECTIVE',
  VOCATIONAL = 'VOCATIONAL',
}

export enum CurriculumType {
  NIGERIAN = 'NIGERIAN',
  IGCSE = 'IGCSE',
  OTHER = 'OTHER',
}

export interface SubjectAttributes {
  id: string;
  name: string;
  code: string;
  level: 'Pre-Nursery' | 'Nursery' | 'Primary' | 'Secondary';
  creditUnits: number;
  subjectCategory?: SubjectCategory;
  description?: string;
  curriculumType?: CurriculumType;
  prerequisiteSubjects?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface SubjectCreationAttributes extends Optional<SubjectAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public level!: 'Pre-Nursery' | 'Nursery' | 'Primary' | 'Secondary';
  public creditUnits!: number;
  public subjectCategory?: SubjectCategory;
  public description?: string;
  public curriculumType?: CurriculumType;
  public prerequisiteSubjects?: string[];
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // Instance methods
  public get isAdvanced(): boolean {
    return this.level === 'Secondary' && this.creditUnits >= 3;
  }

  public get isProgramming(): boolean {
    return this.name.toLowerCase().includes('programming') || 
           this.name.toLowerCase().includes('dart') ||
           this.name.toLowerCase().includes('computer');
  }
}

Subject.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
      },
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 10],
      },
    },
    level: {
      type: DataTypes.ENUM('Pre-Nursery', 'Nursery', 'Primary', 'Secondary'),
      allowNull: false,
    },
    creditUnits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 5,
      },
    },
    subjectCategory: {
      type: DataTypes.ENUM('CORE', 'ELECTIVE', 'VOCATIONAL'),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    curriculumType: {
      type: DataTypes.ENUM('NIGERIAN', 'IGCSE', 'OTHER'),
      allowNull: true,
    },
    prerequisiteSubjects: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Subject',
    tableName: 'subjects',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['level'],
      },
      {
        fields: ['subjectCategory'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

export default Subject;
