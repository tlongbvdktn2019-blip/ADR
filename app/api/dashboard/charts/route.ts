// =====================================================
// DASHBOARD CHARTS API
// API endpoints for dashboard chart data
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type AgeRow = { patient_age: number | null };
type SeverityRow = { severity_level: string | null };
type TrendRow = { created_at: string; severity_level: string | null };
type OutcomeRow = { outcome_after_treatment: string | null };
type FacilityRow = { organization: string | null };
type DrugRow = { drug_name: string; commercial_name: string | null };
type ReportsByDateRow = {
  report_date: string | null;
  created_at: string;
  severity_level: string | null;
  id: string;
};
type OccupationRow = { reporter_profession: string | null };
type GenderRow = { patient_gender: string | null };

type ChartData = {
  ageDistribution?: Array<{ ageRange: string; count: number; percentage: number }>;
  severityDistribution?: Array<{ severity: string; severityKey: string; count: number; percentage: number }>;
  monthlyTrends?: Array<{ month: string; monthKey: string; total: number; serious: number; nonSerious: number }>;
  drugDistribution?: Array<{ drugName: string; count: number; percentage: number }>;
  outcomeDistribution?: Array<{ outcome: string; outcomeKey: string; count: number; percentage: number }>;
  topFacilities?: Array<{ facilityName: string; count: number; percentage: number }>;
  topDrugs?: Array<{ drugName: string; count: number; commercialNames: string; percentage: number }>;
  occupationAnalysis?: Array<{ profession: string; count: number; percentage: number }>;
  reportsByDate?: Array<{ date: string; dateKey: string; total: number; serious: number; nonSerious: number }>;
  genderDistribution?: Array<{ gender: string; genderKey: string; count: number; percentage: number }>;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('type');

    const chartData: ChartData = {};

    // Age distribution
    if (!chartType || chartType === 'age') {
      const { data, error } = await supabase
        .from('adr_reports')
        .select('patient_age');

      if (!error && data) {
        const rows = data as AgeRow[];
        const ageGroups: Record<string, number> = {
          '0-18': 0,
          '19-30': 0,
          '31-50': 0,
          '51-65': 0,
          '66+': 0,
        };

        rows.forEach(({ patient_age }) => {
          const age = patient_age ?? 0;
          if (age <= 18) ageGroups['0-18']++;
          else if (age <= 30) ageGroups['19-30']++;
          else if (age <= 50) ageGroups['31-50']++;
          else if (age <= 65) ageGroups['51-65']++;
          else ageGroups['66+']++;
        });

        const total = rows.length || 1;
        chartData.ageDistribution = Object.entries(ageGroups).map(([range, count]) => ({
          ageRange: range,
          count,
          percentage: Math.round((count / total) * 100),
        }));
      }
    }

    // Severity distribution
    if (!chartType || chartType === 'severity') {
      const { data, error } = await supabase
        .from('adr_reports')
        .select('severity_level');

      if (!error && data) {
        const rows = data as SeverityRow[];
        const severityCount: Record<string, number> = {};

        rows.forEach(({ severity_level }) => {
          const level = severity_level || 'unknown';
          severityCount[level] = (severityCount[level] || 0) + 1;
        });

        const labels: Record<string, string> = {
          death: 'Tử vong',
          life_threatening: 'Nguy hiểm tính mạng',
          hospitalization: 'Nhập viện',
          prolongation: 'Kéo dài nằm viện',
          disability: 'Tàn tật',
          congenital_anomaly: 'Dị tật bẩm sinh',
          other_important: 'Quan trọng khác',
          not_serious: 'Không nghiêm trọng',
          unknown: 'Chưa xác định',
        };

        const total = rows.length || 1;
        chartData.severityDistribution = Object.entries(severityCount)
          .map(([level, count]) => ({
            severity: labels[level] || level,
            severityKey: level,
            count,
            percentage: Math.round((count / total) * 100),
          }))
          .sort((a, b) => b.count - a.count);
      }
    }

    // Monthly trends (last 12 months)
    if (!chartType || chartType === 'trends') {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data, error } = await supabase
        .from('adr_reports')
        .select('created_at, severity_level')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      if (!error && data) {
        const rows = data as TrendRow[];
        const monthly: Record<string, { total: number; serious: number }> = {};
        const seriousLevels = new Set(['death', 'life_threatening', 'hospitalization', 'disability']);

        rows.forEach(({ created_at, severity_level }) => {
          const monthKey = new Date(created_at).toISOString().slice(0, 7);
          if (!monthly[monthKey]) {
            monthly[monthKey] = { total: 0, serious: 0 };
          }
          monthly[monthKey].total++;
          if (severity_level && seriousLevels.has(severity_level)) {
            monthly[monthKey].serious++;
          }
        });

        const months: Array<{ month: string; monthKey: string; total: number; serious: number; nonSerious: number }> = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = date.toISOString().slice(0, 7);
          const label = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
          const totals = monthly[key] || { total: 0, serious: 0 };
          months.push({
            month: label,
            monthKey: key,
            total: totals.total,
            serious: totals.serious,
            nonSerious: totals.total - totals.serious,
          });
        }

        chartData.monthlyTrends = months;
      }
    }

    // Drug distribution
    if (!chartType || chartType === 'drugs') {
      const { data, error } = await supabase
        .from('suspected_drugs')
        .select('drug_name');

      if (!error && data) {
        const rows = data as DrugRow[];
        const count: Record<string, number> = {};

        rows.forEach(({ drug_name }) => {
          const key = (drug_name || 'khác').trim().toLowerCase();
          count[key] = (count[key] || 0) + 1;
        });

        const total = rows.length || 1;
        chartData.drugDistribution = Object.entries(count)
          .map(([drug, value]) => ({
            drugName: drug.charAt(0).toUpperCase() + drug.slice(1),
            count: value,
            percentage: Math.round((value / total) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }
    }

    // Outcome distribution
    if (!chartType || chartType === 'outcomes') {
      const { data, error } = await supabase
        .from('adr_reports')
        .select('outcome_after_treatment');

      if (!error && data) {
        const rows = data as OutcomeRow[];
        const counts: Record<string, number> = {};

        rows.forEach(({ outcome_after_treatment }) => {
          const outcome = outcome_after_treatment || 'unknown';
          counts[outcome] = (counts[outcome] || 0) + 1;
        });

        const labels: Record<string, string> = {
          completely_recovered: 'Hoàn toàn khỏi',
          recovering: 'Đang hồi phục',
          not_recovered: 'Chưa khỏi',
          recovered_with_sequelae: 'Khỏi có di chứng',
          death: 'Tử vong',
          unknown: 'Chưa xác định',
        };

        const total = rows.length || 1;
        chartData.outcomeDistribution = Object.entries(counts).map(([key, value]) => ({
          outcome: labels[key] || key,
          outcomeKey: key,
          count: value,
          percentage: Math.round((value / total) * 100),
        }));
      }
    }

    // Top 10 facilities
    if (!chartType || chartType === 'facilities') {
      const { data, error } = await supabase
        .from('adr_reports')
        .select('organization');

      if (!error && data) {
        const rows = data as FacilityRow[];
        const counts: Record<string, number> = {};

        rows.forEach(({ organization }) => {
          const key = organization?.trim() || 'Chưa xác định';
          counts[key] = (counts[key] || 0) + 1;
        });

        const total = rows.length || 1;
        chartData.topFacilities = Object.entries(counts)
          .map(([facility, value]) => ({
            facilityName: facility,
            count: value,
            percentage: Math.round((value / total) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }
    }

    // Top 10 suspected drugs (detailed)
    if (!chartType || chartType === 'topDrugs') {
      const { data, error } = await supabase
        .from('suspected_drugs')
        .select('drug_name, commercial_name');

      if (!error && data) {
        const rows = data as DrugRow[];
        const stats: Record<string, { count: number; commercial: Set<string> }> = {};

        rows.forEach(({ drug_name, commercial_name }) => {
          const key = (drug_name || 'khác').trim().toLowerCase();
          if (!stats[key]) {
            stats[key] = { count: 0, commercial: new Set<string>() };
          }
          stats[key].count++;
          if (commercial_name) {
            stats[key].commercial.add(commercial_name);
          }
        });

        const total = rows.length || 1;
        chartData.topDrugs = Object.entries(stats)
          .map(([drug, info]) => ({
            drugName: drug.charAt(0).toUpperCase() + drug.slice(1),
            count: info.count,
            commercialNames: info.commercial.size > 0 ? Array.from(info.commercial).join(', ') : 'Không có',
            percentage: Math.round((info.count / total) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      }
    }

    // Occupation analysis
    if (!chartType || chartType === 'occupation') {
      const { data, error } = await supabase
        .from('adr_reports')
        .select('reporter_profession');

      if (!error && data) {
        const rows = data as OccupationRow[];
        const counts: Record<string, number> = {};

        rows.forEach(({ reporter_profession }) => {
          const key = reporter_profession?.trim() || 'Chưa xác định';
          counts[key] = (counts[key] || 0) + 1;
        });

        const total = rows.length || 1;
        chartData.occupationAnalysis = Object.entries(counts)
          .map(([profession, value]) => ({
            profession,
            count: value,
            percentage: Math.round((value / total) * 100),
          }))
          .sort((a, b) => b.count - a.count);
      }
    }

    // Reports by date
    if (!chartType || chartType === 'reportsByDate') {
      const { data, error } = await supabase
        .from('adr_reports')
        .select('report_date, created_at, severity_level, id')
        .order('created_at', { ascending: true });

      if (!error && data) {
        const rows = data as ReportsByDateRow[];

        if (rows.length === 0) {
          chartData.reportsByDate = [];
        } else {
          const monthlyCount: Record<string, { total: number; serious: number }> = {};
          const seriousLevels = new Set(['death', 'life_threatening', 'hospitalization', 'disability', 'congenital_anomaly']);

          rows.forEach((report) => {
            let dateToUse = report.report_date;
            if (!dateToUse && report.created_at) {
              dateToUse = report.created_at.split('T')[0];
            }
            if (!dateToUse) {
              return;
            }
            const monthKey = dateToUse.slice(0, 7);
            if (!monthlyCount[monthKey]) {
              monthlyCount[monthKey] = { total: 0, serious: 0 };
            }
            monthlyCount[monthKey].total++;
            if (report.severity_level && seriousLevels.has(report.severity_level)) {
              monthlyCount[monthKey].serious++;
            }
          });

          const monthsWithData = Object.keys(monthlyCount).sort();
          chartData.reportsByDate = monthsWithData.map((monthKey) => {
            const [year, month] = monthKey.split('-');
            const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
            const label = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
            const values = monthlyCount[monthKey];
            return {
              date: label,
              dateKey: monthKey,
              total: values.total,
              serious: values.serious,
              nonSerious: values.total - values.serious,
            };
          });
        }
      }
    }

    // Gender distribution
    if (!chartType || chartType === 'gender') {
      const { data, error } = await supabase
        .from('adr_reports')
        .select('patient_gender');

      if (!error && data) {
        const rows = data as GenderRow[];
        const counts: Record<string, number> = {};

        rows.forEach(({ patient_gender }) => {
          const gender = patient_gender || 'unknown';
          counts[gender] = (counts[gender] || 0) + 1;
        });

        const labels: Record<string, string> = {
          male: 'Nam',
          female: 'Nữ',
          other: 'Khác',
          unknown: 'Chưa xác định',
        };

        const total = rows.length || 1;
        chartData.genderDistribution = Object.entries(counts)
          .map(([key, value]) => ({
            gender: labels[key] || key,
            genderKey: key,
            count: value,
            percentage: Math.round((value / total) * 100),
          }))
          .sort((a, b) => b.count - a.count);
      }
    }

    return NextResponse.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('❌ [CHARTS API] Dashboard charts API error:', error);
    return NextResponse.json(
      {
        error: 'Không thể tải dữ liệu biểu đồ',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}


