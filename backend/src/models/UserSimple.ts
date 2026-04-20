import { supabase } from '../config/supabase';

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
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User {
  static async create(userData: UserCreationAttributes): Promise<UserAttributes> {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  static async findById(id: string): Promise<UserAttributes | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  static async findByEmail(email: string): Promise<UserAttributes | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return data;
  }

  static async findAll(options?: {
    limit?: number;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<UserAttributes[]> {
    let query = supabase.from('users').select('*');

    if (options?.role) {
      query = query.eq('role', options.role);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }

  static async update(id: string, updateData: Partial<UserAttributes>): Promise<UserAttributes> {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  static async count(options?: {
    role?: UserRole;
    status?: UserStatus;
  }): Promise<number> {
    let query = supabase.from('users').select('*', { count: 'exact', head: true });

    if (options?.role) {
      query = query.eq('role', options.role);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }

    return count || 0;
  }

  static async updateLastLogin(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ lastLogin: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  // Instance methods (for compatibility with existing code)
  id!: string;
  email!: string;
  password!: string;
  name!: string;
  role!: UserRole;
  status!: UserStatus;
  lastLogin?: Date;
  emailVerified!: boolean;
  phone?: string;
  address?: string;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(userData: UserAttributes) {
    Object.assign(this, userData);
  }

  toJSON(): UserAttributes {
    const values = { ...this };
    const result: UserAttributes = {
      id: values.id,
      email: values.email,
      password: values.password,
      name: values.name,
      role: values.role,
      status: values.status,
      emailVerified: values.emailVerified,
    };
    
    // Add optional properties only if they exist
    if (values.lastLogin) result.lastLogin = values.lastLogin;
    if (values.phone) result.phone = values.phone;
    if (values.address) result.address = values.address;
    if (values.profileImage) result.profileImage = values.profileImage;
    if (values.createdAt) result.createdAt = values.createdAt;
    if (values.updatedAt) result.updatedAt = values.updatedAt;
    
    return result;
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(candidatePassword, this.password);
  }

  async save(): Promise<UserAttributes> {
    if (this.id) {
      return User.update(this.id, this.toJSON());
    } else {
      return User.create(this.toJSON() as UserCreationAttributes);
    }
  }

  async destroy(): Promise<void> {
    if (this.id) {
      await User.delete(this.id);
    }
  }
}

export default User;
