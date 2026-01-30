import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
import '../src/config/env.js';

const prisma = new PrismaClient();

async function updateAdminPassword() {
  // Email: first CLI arg or env UPDATE_ADMIN_EMAIL (required)
  // Password: second CLI arg or env UPDATE_ADMIN_PASSWORD or default "admin123"
  const emailRaw = process.argv[2] || process.env.UPDATE_ADMIN_EMAIL;
  const password = process.argv[3] || process.env.UPDATE_ADMIN_PASSWORD || 'admin123';

  if (!emailRaw || !emailRaw.trim()) {
    console.error('Usage: node scripts/updateAdminPassword.js <email> [password]');
    console.error('   Or set env: UPDATE_ADMIN_EMAIL, UPDATE_ADMIN_PASSWORD');
    console.error('   If password is omitted, "admin123" is used.');
    process.exit(1);
  }

  const email = emailRaw.trim().toLowerCase();

  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      console.error('❌ No admin found with email:', email);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log('✅ Admin password updated successfully (stored as bcrypt hash).');
    console.log('📧 Email:', email);
    console.log('🔑 You can now log in with this email and the password you provided.');
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
