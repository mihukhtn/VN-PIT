export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      dependents: {
        Row: {
          birth_date: string | null
          cccd: string | null
          created_at: string | null
          deduction_end_month: string | null
          deduction_start_month: string
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean | null
          relation: string
          tax_code: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          cccd?: string | null
          created_at?: string | null
          deduction_end_month?: string | null
          deduction_start_month: string
          employee_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          relation: string
          tax_code?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          cccd?: string | null
          created_at?: string | null
          deduction_end_month?: string | null
          deduction_start_month?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          relation?: string
          tax_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dependents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          cccd: string | null
          code: string
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          tax_code: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          cccd?: string | null
          code: string
          created_at?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          tax_code?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          cccd?: string | null
          code?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          tax_code?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      income_records: {
        Row: {
          created_at: string | null
          dependent_deduction: number | null
          employee_id: string | null
          id: string
          insurance_deduction: number | null
          month: string
          self_deduction: number | null
          tax_amount: number | null
          tax_exempt_income: number | null
          taxable_income: number | null
          total_income: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dependent_deduction?: number | null
          employee_id?: string | null
          id?: string
          insurance_deduction?: number | null
          month: string
          self_deduction?: number | null
          tax_amount?: number | null
          tax_exempt_income?: number | null
          taxable_income?: number | null
          total_income?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dependent_deduction?: number | null
          employee_id?: string | null
          id?: string
          insurance_deduction?: number | null
          month?: string
          self_deduction?: number | null
          tax_amount?: number | null
          tax_exempt_income?: number | null
          taxable_income?: number | null
          total_income?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
