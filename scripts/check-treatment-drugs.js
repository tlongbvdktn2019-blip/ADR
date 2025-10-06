#!/usr/bin/env node

/**
 * Script to check treatment_drugs table data and API
 * Run: node scripts/check-treatment-drugs.js
 */

const https = require('https');
const http = require('http');

// Color codes for console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function checkAPI(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: JSON.parse(data)
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  log(colors.cyan, '\n=================================');
  log(colors.cyan, 'Kiểm tra Treatment Drugs API');
  log(colors.cyan, '=================================\n');

  // Check if running locally or on production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/public/treatment-drugs`;

  log(colors.blue, '📍 API URL:', apiUrl);
  log(colors.blue, '⏳ Đang kiểm tra...\n');

  try {
    const { statusCode, data } = await checkAPI(apiUrl);

    if (statusCode === 200) {
      log(colors.green, '✅ API hoạt động tốt!');
      log(colors.green, `✅ Tìm thấy ${data.count || data.treatmentDrugs?.length || 0} nhóm thuốc\n`);

      if (data.treatmentDrugs && data.treatmentDrugs.length > 0) {
        log(colors.cyan, '📋 Danh sách nhóm thuốc:');
        log(colors.cyan, '------------------------');
        data.treatmentDrugs.forEach((drug, index) => {
          console.log(`${index + 1}. ${drug.name} (ID: ${drug.id})`);
        });
      } else {
        log(colors.yellow, '⚠️  CẢNH BÁO: Bảng treatment_drugs không có dữ liệu!');
        log(colors.yellow, '\nHướng dẫn fix:');
        log(colors.yellow, '1. Chạy migration: supabase db push');
        log(colors.yellow, '2. Hoặc chạy file: supabase/migrations/fix_treatment_drugs_public_access.sql');
        log(colors.yellow, '3. Xem hướng dẫn: docs/FIX-TREATMENT-DRUGS-PUBLIC-FORM.md');
      }
    } else {
      log(colors.red, '❌ API trả về lỗi!');
      log(colors.red, `Status: ${statusCode}`);
      log(colors.red, 'Response:', JSON.stringify(data, null, 2));
      
      log(colors.yellow, '\n💡 Gợi ý:');
      log(colors.yellow, '1. Kiểm tra SUPABASE_SERVICE_ROLE_KEY trong .env.local');
      log(colors.yellow, '2. Kiểm tra bảng treatment_drugs có tồn tại không');
      log(colors.yellow, '3. Kiểm tra RLS policies cho bảng treatment_drugs');
      log(colors.yellow, '4. Xem logs server để biết chi tiết');
    }
  } catch (error) {
    log(colors.red, '❌ Không thể kết nối đến API!');
    log(colors.red, 'Lỗi:', error.message);
    
    log(colors.yellow, '\n💡 Gợi ý:');
    log(colors.yellow, '1. Đảm bảo server đang chạy (npm run dev)');
    log(colors.yellow, '2. Kiểm tra URL:', apiUrl);
    log(colors.yellow, '3. Kiểm tra firewall/network');
  }

  log(colors.cyan, '\n=================================\n');
}

main();





