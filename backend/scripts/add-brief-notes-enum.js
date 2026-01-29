#!/usr/bin/env node
/**
 * One-time script: Add BRIEF_NOTES to ResourceType enum in PostgreSQL.
 * Run from backend folder: node scripts/add-brief-notes-enum.js
 * Uses same env as app (DATABASE_URL from DATABASE_PUBLIC_URL).
 */
import './setup-env.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // PostgreSQL: add new enum value (safe to run multiple times with IF NOT EXISTS on PG 9.1+)
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "ResourceType" ADD VALUE IF NOT EXISTS 'BRIEF_NOTES'`
    );
    console.log('✅ Successfully added BRIEF_NOTES to ResourceType enum.');
  } catch (e) {
    // IF NOT EXISTS not supported on older PostgreSQL; try without it
    if (e.message && e.message.includes('already exists')) {
      console.log('✅ BRIEF_NOTES already exists in ResourceType enum. Nothing to do.');
      process.exit(0);
      return;
    }
    if (e.message && e.message.includes('IF NOT EXISTS')) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "ResourceType" ADD VALUE 'BRIEF_NOTES'`
        );
        console.log('✅ Successfully added BRIEF_NOTES to ResourceType enum.');
      } catch (e2) {
        if (e2.message && e2.message.includes('already exists')) {
          console.log('✅ BRIEF_NOTES already exists. Nothing to do.');
          process.exit(0);
          return;
        }
        console.error('❌ Failed to add enum value:', e2.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to add enum value:', e.message);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
