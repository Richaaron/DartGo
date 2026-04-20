import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  development: {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: 'postgres' | 'mysql' | 'sqlite';
    logging: boolean;
  };
  test: {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: 'postgres' | 'mysql' | 'sqlite';
    logging: boolean;
  };
  production: {
    username: string;
    password: string;
    database: string;
    host: string;
    dialect: 'postgres' | 'mysql' | 'sqlite';
    logging: boolean;
    pool: {
      max: number;
      min: number;
      acquire: number;
      idle: number;
    };
  };
}

const config: DatabaseConfig = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'folusho_school_dev',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME_TEST || 'folusho_school_test',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'folusho_school_prod',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
  },
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env as keyof DatabaseConfig];

export const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool || {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
    dialectOptions: {
      ssl: env === 'production' ? {
        require: true,
        rejectUnauthorized: false,
      } : false,
    },
  }
);

export default sequelize;
