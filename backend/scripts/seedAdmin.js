import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import env config to ensure DATABASE_URL is constructed with SSL
import '../src/config/env.js';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const name = 'Admin User';

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', email);
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: admin123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name:', admin.name);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
