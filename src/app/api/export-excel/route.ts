import { NextResponse } from 'next/server';
import { ExcelDatabase } from '@/lib/excel-database';

export async function GET() {
  try {
    const buffer = ExcelDatabase.getRawWorkbookBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="LedgerLoom_Database.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Could not export Excel file' },
      { status: 500 }
    );
  }
}
