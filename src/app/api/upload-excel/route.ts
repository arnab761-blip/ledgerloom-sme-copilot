import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { ExcelDatabase } from '@/lib/excel-database';

const DB_FILE_PATH = path.join(process.cwd(), 'ledgerloom_database.xlsx');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'কোনো এক্সেল (.xlsx) ফাইল পাওয়া যায়নি।' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write uploaded Excel file directly to overwrite database
    fs.writeFileSync(DB_FILE_PATH, buffer);

    // Audit log
    ExcelDatabase.logAudit({
      actor: 'owner',
      action: 'EXCEL_FILE_UPLOAD_SYNC',
      permissionTier: 'Tier-4-Execute',
      targetEntity: 'Workbook',
      details: `Excel database manually synced via upload (${file.name}, size: ${file.size} bytes).`,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'এক্সেল ফাইল সফলভাবে আপলোড ও সিঙ্ক হয়েছে!',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'আপলোড ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}
