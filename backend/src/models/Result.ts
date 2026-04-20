import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum AssessmentType {
  TEST = 'Test',
  EXAM = 'Exam',
  ASSIGNMENT = 'Assignment',
  PROJECT = 'Project',
}

export enum PerformanceRating {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  AVERAGE = 'Average',
  POOR = 'Poor',
  VERY_POOR = 'Very Poor',
}

export interface ResultAttributes {
  id: string;
  studentId: string;
  subjectId: string;
  assessmentType: AssessmentType;
  score: number;
  totalScore: number;
  term: string;
  academicYear: string;
  recordedBy: string;
  notes?: string;
  percentage: number;
  grade: string;
  gradePoint: number;
  remarks: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ResultCreationAttributes extends Optional<ResultAttributes, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Result extends Model<ResultAttributes, ResultCreationAttributes> implements ResultAttributes {
  public id!: string;
  public studentId!: string;
  public subjectId!: string;
  public assessmentType!: AssessmentType;
  public score!: number;
  public totalScore!: number;
  public term!: string;
  public academicYear!: string;
  public recordedBy!: string;
  public notes?: string;
  public percentage!: number;
  public grade!: string;
  public gradePoint!: number;
  public remarks!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;

  // Instance methods
  public calculateGrade(): void {
    this.percentage = (this.score / this.totalScore) * 100;
    
    // Grade calculation based on Nigerian grading system
    if (this.percentage >= 90) {
      this.grade = 'A';
      this.gradePoint = 4.0;
      this.remarks = PerformanceRating.EXCELLENT;
    } else if (this.percentage >= 80) {
      this.grade = 'B';
      this.gradePoint = 3.0;
      this.remarks = PerformanceRating.GOOD;
    } else if (this.percentage >= 70) {
      this.grade = 'C';
      this.gradePoint = 2.0;
      this.remarks = PerformanceRating.AVERAGE;
    } else if (this.percentage >= 60) {
      this.grade = 'D';
      this.gradePoint = 1.0;
      this.remarks = PerformanceRating.POOR;
    } else {
      this.grade = 'F';
      this.gradePoint = 0.0;
      this.remarks = PerformanceRating.VERY_POOR;
    }
  }

  public get passed(): boolean {
    return this.percentage >= 50;
  }
}

Result.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    assessmentType: {
      type: DataTypes.ENUM('Test', 'Exam', 'Assignment', 'Project'),
      allowNull: false,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 999.99,
      },
    },
    totalScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 1,
        max: 999.99,
      },
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['First Term', 'Second Term', 'Third Term']],
      },
    },
    academicYear: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^\d{4}\/\d{4}$/, // e.g., 2023/2024
      },
    },
    recordedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['A', 'B', 'C', 'D', 'F']],
      },
    },
    gradePoint: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
    },
    remarks: {
      type: DataTypes.ENUM('Excellent', 'Good', 'Average', 'Poor', 'Very Poor'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Result',
    tableName: 'results',
    paranoid: true,
    indexes: [
      {
        fields: ['studentId'],
      },
      {
        fields: ['subjectId'],
      },
      {
        fields: ['assessmentType'],
      },
      {
        fields: ['term'],
      },
      {
        fields: ['academicYear'],
      },
      {
        fields: ['recordedBy'],
      },
      {
        fields: ['grade'],
      },
    ],
  }
);

// Hooks
Result.beforeCreate((result: Result) => {
  result.calculateGrade();
});

Result.beforeUpdate((result: Result) => {
  if (result.changed('score') || result.changed('totalScore')) {
    result.calculateGrade();
  }
});

export default Result;
