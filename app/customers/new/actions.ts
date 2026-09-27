'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCustomer(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const phone = String(formData.get('phone') || '').trim() || null
  const cccd = String(formData.get('cccd') || '').trim() || null
  const dob = String(formData.get('dob') || '').trim() || null
  const gender = String(formData.get('gender') || '').trim() || null
  const address = String(formData.get('address') || '').trim() || null
  const zalo_id = String(formData.get('zalo_id') || '').trim() || null
  const note = String(formData.get('note') || '').trim() || null

  if (!name) {
    throw new Error('Thiếu tên khách hàng.')
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert({ name, phone, cccd, dob, gender, address, zalo_id, note })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Số CCCD này đã có trong hệ thống — kiểm tra lại tránh trùng khách hàng.')
    }
    throw new Error(error.message)
  }

  redirect(`/customers/${data.id}`)
}
