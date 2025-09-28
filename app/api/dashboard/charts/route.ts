// =====================================================
// DASHBOARD CHARTS API
// API endpoints for dashboard chart data
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/dashboard/charts
 * Get chart data for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [CHARTS API] Starting dashboard charts API call...');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('❌ [CHARTS API] No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [CHARTS API] Session found:', {
      userId: session.user.id,
      userRole: (session.user as any).role,
      userEmail: session.user.email
    });

    const supabase = createServerClient();
    const isAdmin = (session.user as any).role === 'admin';
    
    console.log('🔑 [CHARTS API] User is admin:', isAdmin);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('type');

    // No filtering by user role - both admin and user can view charts for all reports
    // This provides system-wide analytics while maintaining edit restrictions
    const baseCondition = {};

    let chartData: any = {};

    // Age Distribution Chart
    if (!chartType || chartType === 'age') {
      console.log('👥 [CHARTS API] Fetching age distribution data...');
      
      const { data: ageData, error: ageError } = await supabase
        .from('adr_reports')
        .select('patient_age')
        .match(baseCondition);

      if (ageError) {
        console.error('❌ [CHARTS API] Age data error:', ageError);
      } else {
        console.log(`✅ [CHARTS API] Age data fetched: ${ageData?.length || 0} records`);
      }

      if (!ageError && ageData) {
        const ageGroups = {
          '0-18': 0,
          '19-30': 0,
          '31-50': 0,
          '51-65': 0,
          '66+': 0
        };

        ageData.forEach(report => {
          const age = report.patient_age;
          if (age <= 18) ageGroups['0-18']++;
          else if (age <= 30) ageGroups['19-30']++;
          else if (age <= 50) ageGroups['31-50']++;
          else if (age <= 65) ageGroups['51-65']++;
          else ageGroups['66+']++;
        });

        chartData.ageDistribution = Object.entries(ageGroups).map(([range, count]) => ({
          ageRange: range,
          count,
          percentage: ageData.length > 0 ? Math.round((count / ageData.length) * 100) : 0
        }));
      }
    }

    // Severity Level Chart
    if (!chartType || chartType === 'severity') {
      const { data: severityData, error: severityError } = await supabase
        .from('adr_reports')
        .select('severity_level')
        .match(baseCondition);

      if (!severityError && severityData) {
        const severityCount: { [key: string]: number } = {};
        
        severityData.forEach(report => {
          const level = report.severity_level || 'unknown';
          severityCount[level] = (severityCount[level] || 0) + 1;
        });

        const severityLabels: { [key: string]: string } = {
          'death': 'Tử vong',
          'life_threatening': 'Nguy hiểm tính mạng',
          'hospitalization': 'Nhập viện',
          'prolongation': 'Kéo dài nằm viện',
          'disability': 'Tàn tật',
          'congenital_anomaly': 'Dị tật bẩm sinh',
          'other_important': 'Quan trọng khác',
          'not_serious': 'Không nghiêm trọng',
          'unknown': 'Chưa xác định'
        };

        chartData.severityDistribution = Object.entries(severityCount).map(([level, count]) => ({
          severity: severityLabels[level] || level,
          severityKey: level,
          count,
          percentage: severityData.length > 0 ? Math.round((count / severityData.length) * 100) : 0
        })).sort((a, b) => b.count - a.count);
      }
    }

    // Monthly Trends Chart (last 12 months)
    if (!chartType || chartType === 'trends') {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: trendsData, error: trendsError } = await supabase
        .from('adr_reports')
        .select('created_at, severity_level')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .match(baseCondition)
        .order('created_at', { ascending: true });

      if (!trendsError && trendsData) {
        const monthlyData: { [key: string]: { total: number; serious: number } } = {};
        
        trendsData.forEach(report => {
          const month = new Date(report.created_at).toISOString().slice(0, 7); // YYYY-MM
          if (!monthlyData[month]) {
            monthlyData[month] = { total: 0, serious: 0 };
          }
          monthlyData[month].total++;
          
          const seriousLevels = ['death', 'life_threatening', 'hospitalization', 'disability'];
          if (seriousLevels.includes(report.severity_level)) {
            monthlyData[month].serious++;
          }
        });

        // Fill missing months with 0
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toISOString().slice(0, 7);
          const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
          
          months.push({
            month: monthName,
            monthKey,
            total: monthlyData[monthKey]?.total || 0,
            serious: monthlyData[monthKey]?.serious || 0,
            nonSerious: (monthlyData[monthKey]?.total || 0) - (monthlyData[monthKey]?.serious || 0)
          });
        }

        chartData.monthlyTrends = months;
      }
    }

    // Drug Category Analysis (top 10 drugs)
    if (!chartType || chartType === 'drugs') {
      const { data: drugData, error: drugError } = await supabase
        .from('suspected_drugs')
        .select('drug_name, adr_reports!inner(reporter_id)')
        .match(isAdmin ? {} : { 'adr_reports.reporter_id': session.user.id });

      if (!drugError && drugData) {
        const drugCount: { [key: string]: number } = {};
        
        drugData.forEach(drug => {
          const drugName = drug.drug_name.toLowerCase();
          drugCount[drugName] = (drugCount[drugName] || 0) + 1;
        });

        chartData.drugDistribution = Object.entries(drugCount)
          .map(([drug, count]) => ({
            drugName: drug.charAt(0).toUpperCase() + drug.slice(1),
            count,
            percentage: drugData.length > 0 ? Math.round((count / drugData.length) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10
      }
    }

    // Outcome Analysis
    if (!chartType || chartType === 'outcomes') {
      const { data: outcomeData, error: outcomeError } = await supabase
        .from('adr_reports')
        .select('outcome_after_treatment')
        .match(baseCondition);

      if (!outcomeError && outcomeData) {
        const outcomeCount: { [key: string]: number } = {};
        
        outcomeData.forEach(report => {
          const outcome = report.outcome_after_treatment || 'unknown';
          outcomeCount[outcome] = (outcomeCount[outcome] || 0) + 1;
        });

        const outcomeLabels: { [key: string]: string } = {
          'completely_recovered': 'Hoàn toàn khỏi',
          'recovering': 'Đang hồi phục',
          'not_recovered': 'Chưa khỏi',
          'recovered_with_sequelae': 'Khỏi có di chứng',
          'death': 'Tử vong',
          'unknown': 'Chưa xác định'
        };

        chartData.outcomeDistribution = Object.entries(outcomeCount).map(([outcome, count]) => ({
          outcome: outcomeLabels[outcome] || outcome,
          outcomeKey: outcome,
          count,
          percentage: outcomeData.length > 0 ? Math.round((count / outcomeData.length) * 100) : 0
        })).sort((a, b) => b.count - a.count);
      }
    }

    // Top 10 Facilities Analysis 
    if (!chartType || chartType === 'facilities') {
      const { data: facilityData, error: facilityError } = await supabase
        .from('adr_reports')
        .select('organization')
        .match(baseCondition);

      if (!facilityError && facilityData) {
        const facilityCount: { [key: string]: number } = {};
        
        facilityData.forEach(report => {
          const facility = report.organization || 'Chưa xác định';
          facilityCount[facility] = (facilityCount[facility] || 0) + 1;
        });

        chartData.topFacilities = Object.entries(facilityCount)
          .map(([facility, count]) => ({
            facilityName: facility,
            count,
            percentage: facilityData.length > 0 ? Math.round((count / facilityData.length) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10
      }
    }

    // Top 10 Suspected Drugs (Enhanced)
    if (!chartType || chartType === 'topDrugs') {
      const { data: suspectedDrugData, error: suspectedDrugError } = await supabase
        .from('suspected_drugs')
        .select('drug_name, commercial_name, adr_reports!inner(id)')
        .match(baseCondition);

      if (!suspectedDrugError && suspectedDrugData) {
        const drugCount: { [key: string]: { count: number; commercial: string[] } } = {};
        
        suspectedDrugData.forEach(drug => {
          const drugName = drug.drug_name.toLowerCase();
          if (!drugCount[drugName]) {
            drugCount[drugName] = { count: 0, commercial: [] };
          }
          drugCount[drugName].count++;
          if (drug.commercial_name && !drugCount[drugName].commercial.includes(drug.commercial_name)) {
            drugCount[drugName].commercial.push(drug.commercial_name);
          }
        });

        chartData.topDrugs = Object.entries(drugCount)
          .map(([drug, data]) => ({
            drugName: drug.charAt(0).toUpperCase() + drug.slice(1),
            count: data.count,
            commercialNames: data.commercial.join(', ') || 'Không có',
            percentage: suspectedDrugData.length > 0 ? Math.round((data.count / suspectedDrugData.length) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10
      }
    }

    // Reports by Occupation Analysis
    if (!chartType || chartType === 'occupation') {
      const { data: occupationData, error: occupationError } = await supabase
        .from('adr_reports')
        .select('reporter_profession')
        .match(baseCondition);

      if (!occupationError && occupationData) {
        const occupationCount: { [key: string]: number } = {};
        
        occupationData.forEach(report => {
          const profession = report.reporter_profession || 'Chưa xác định';
          occupationCount[profession] = (occupationCount[profession] || 0) + 1;
        });

        chartData.occupationAnalysis = Object.entries(occupationCount)
          .map(([profession, count]) => ({
            profession: profession,
            count,
            percentage: occupationData.length > 0 ? Math.round((count / occupationData.length) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count);
      }
    }

    // Reports by Month Analysis - FIXED VERSION (from working detailed debug)
    if (!chartType || chartType === 'reportsByDate') {
      console.log('📅 [CHARTS API] Fetching monthly reports data (FIXED)...');
      
      // Get ALL reports - same as detailed debug that works
      const { data: dateData, error: dateError } = await supabase
        .from('adr_reports')
        .select('report_date, created_at, severity_level, id')
        .order('created_at', { ascending: true });

      if (dateError) {
        console.error('❌ [CHARTS API] Monthly reports data error:', dateError);
      } else {
        console.log(`✅ [CHARTS API] Monthly reports data fetched: ${dateData?.length || 0} records`);
      }

      if (!dateError && dateData) {
        console.log(`✅ [CHARTS API] Processing ${dateData.length} reports for monthly grouping...`);

        if (!dateData || dateData.length === 0) {
          console.log('❌ [CHARTS API] No reports found');
          chartData.reportsByDate = [];
        } else {
          // COPY EXACT LOGIC FROM WORKING DETAILED DEBUG API
          const monthlyCount: { [key: string]: { total: number; serious: number } } = {};
          
          dateData.forEach((report: any, index: number) => {
            // Use report_date FIRST, fallback to created_at (same as detailed debug)
            let dateToUse = report.report_date;
            if (!dateToUse && report.created_at) {
              dateToUse = report.created_at.split('T')[0];
            }

            if (!dateToUse) {
              console.log(`⚠️ [CHARTS API] Report ${report.id} - NO DATE - SKIPPING`);
              return;
            }

            // Extract month key
            const monthKey = dateToUse.slice(0, 7);

            if (!monthlyCount[monthKey]) {
              monthlyCount[monthKey] = { total: 0, serious: 0 };
              console.log(`📅 [CHARTS API] Created month: ${monthKey}`);
            }

            monthlyCount[monthKey].total++;

            const seriousLevels = ['death', 'life_threatening', 'hospitalization', 'disability', 'congenital_anomaly'];
            if (seriousLevels.includes(report.severity_level)) {
              monthlyCount[monthKey].serious++;
            }
          });

          console.log(`📊 [CHARTS API] Processing complete. Monthly buckets: ${Object.keys(monthlyCount).length}`);

          // Create final monthly trends - EXACT COPY FROM WORKING DETAILED DEBUG
          const monthsWithData = Object.keys(monthlyCount).sort();
          const reportsByMonth = monthsWithData.map(monthKey => {
            const [year, month] = monthKey.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthDisplay = date.toLocaleDateString('vi-VN', { 
              month: 'short', 
              year: 'numeric'
            });

            return {
              date: monthDisplay,
              dateKey: monthKey,
              total: monthlyCount[monthKey].total,
              serious: monthlyCount[monthKey].serious,
              nonSerious: monthlyCount[monthKey].total - monthlyCount[monthKey].serious
            };
          });

          console.log(`✅ [CHARTS API] Final result: ${reportsByMonth.length} months with data`);
          
          chartData.reportsByDate = reportsByMonth;
        }
      }
    }

    console.log('📈 [CHARTS API] Final chart data summary:', {
      totalDataSets: Object.keys(chartData).length,
      dataSets: Object.keys(chartData),
      recordCounts: Object.entries(chartData).reduce((acc, [key, value]: [string, any]) => ({
        ...acc,
        [key]: Array.isArray(value) ? value.length : 'N/A'
      }), {})
    });

    return NextResponse.json({
      success: true,
      data: chartData,
      debug: {
        isAdmin,
        userId: session.user.id,
        totalDataSets: Object.keys(chartData).length
      }
    });

  } catch (error) {
    console.error('❌ [CHARTS API] Dashboard charts API error:', error);
    return NextResponse.json({ 
      error: 'Không thể tải dữ liệu biểu đồ',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
