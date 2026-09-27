'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('role').eq('auth_user_id', user?.id).single()
  if (profile?.role !== 'admin') throw new Error('Không có quyền')
  return supabase
}

export async function upsertProduct(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string | null

  const payload = {
    name: formData.get('name') as string,
    category_id: formData.get('category_id') || null,
    price: Number(formData.get('price')),
    warranty_months: Number(formData.get('warranty_months') || 0),
    barcode: (formData.get('barcode') as string) || null,
  }

  if (id) {
    await supabase.from('products').update(payload).eq('id', id)
  } else {
    // hàng mới thêm: stock_qty khởi tạo 0, phải nhập kho riêng qua inventory_movements
    await supabase.from('products').insert({ ...payload, stock_qty: 0 })
  }
  revalidatePath('/admin/products')
}

export async function adjustStock(productId: string, quantity: number, type: 'nhap' | 'dieu_chinh', note?: string) {
  const supabase = await requireAdmin()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('id').eq('auth_user_id', user?.id).single()

  const { error } = await supabase.from('inventory_movements').insert({
    product_id: productId,
    type,
    quantity,
    note,
    created_by: profile?.id,
  })
  if (error) throw new Error(error.message) // sẽ chứa lỗi "Kho không đủ hàng" nếu trigger chặn
  revalidatePath('/admin/products')
}

export async function upsertCategory(formData: FormData) {
  const supabase = await requireAdmin()
  const id = formData.get('id') as string | null
  const payload = {
    name: formData.get('name') as string,
    sort_order: Number(formData.get('sort_order') || 0),
  }
  if (id) {
    await supabase.from('product_categories').update(payload).eq('id', id)
  } else {
    await supabase.from('product_categories').insert(payload)
  }
  revalidatePath('/admin/products')
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('product_categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}
