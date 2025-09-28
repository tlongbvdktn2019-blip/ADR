// Interface cho Thuốc dùng đồng thời (Concurrent Drugs)
export interface ConcurrentDrug {
  id: string
  report_id?: string
  drug_name: string                    // Tên thuốc
  dosage_form_strength: string        // Dạng bào chế, hàm lượng  
  start_date: string                   // Ngày bắt đầu điều trị
  end_date: string                     // Ngày kết thúc điều trị
  created_at?: string
  updated_at?: string
}

// Type cho form data của concurrent drugs
export interface ConcurrentDrugFormData {
  id: string
  drug_name: string
  dosage_form_strength: string
  start_date: string
  end_date: string
}

// Default empty concurrent drug
export const createEmptyConcurrentDrug = (): ConcurrentDrugFormData => ({
  id: Date.now().toString(),
  drug_name: '',
  dosage_form_strength: '',
  start_date: '',
  end_date: ''
})

// Label mappings for concurrent drugs
export const CONCURRENT_DRUG_LABELS = {
  drug_name: 'Tên thuốc',
  dosage_form_strength: 'Dạng bào chế, hàm lượng',
  start_date: 'Ngày bắt đầu điều trị',
  end_date: 'Ngày kết thúc điều trị'
} as const















