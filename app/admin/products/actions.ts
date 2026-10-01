'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') throw new Error('Chỉ admin mới có quyền này.')
  return { supabase, user }
}

export async function upsertProduct(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const price = Number(formData.get('price'))
  const warrantyMonths = Number(formData.get('warranty_months') || 0)

  if (!name) throw new Error('Nhập tên sản phẩm.')
  if (!Number.isFinite(price) || price < 0) throw new Error('Giá sản phẩm không hợp lệ.')
  if (!Number.isInteger(warrantyMonths) || warrantyMonths < 0) {
    throw new Error('Thời hạn bảo hành phải là số nguyên không âm.')
  }

  const payload = {
    name,
    category_id: String(formData.get('category_id') || '') || null,
    price,
    warranty_months: warrantyMonths,
    barcode: String(formData.get('barcode') || '').trim() || null,
  }

  let error: { message: string } | null = null
  if (id) {
    const result = await supabase.from('products').update(payload).eq('id', id)
    error = result.error
  } else {
    const result = await supabase.from('products').insert({ ...payload, stock_qty: 0 })
    error = result.error
  }
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function adjustStock(productId: string, quantity: number, type: 'nhap' | 'dieu_chinh', note?: string) {
  const { supabase, user } = await requireAdmin()
  if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('Số lượng nhập phải là số nguyên lớn hơn 0.')
  }

  const { error } = await supabase.from('inventory_movements').insert({
    product_id: productId,
    type,
    quantity,
    note,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function upsertCategory(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const sortOrder = Number(formData.get('sort_order') || 0)
  if (!name) throw new Error('Nhập tên nhóm.')
  if (!Number.isInteger(sortOrder)) throw new Error('Thứ tự nhóm phải là số nguyên.')

  const payload = {
    name,
    sort_order: sortOrder,
  }
  let error: { message: string } | null = null
  if (id) {
    const result = await supabase.from('product_categories').update(payload).eq('id', id)
    error = result.error
  } else {
    const result = await supabase.from('product_categories').insert(payload)
    error = result.error
  }
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function deleteCategory(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('product_categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function upsertService(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const defaultPrice = Number(formData.get('default_price') || 0)
  if (!name) throw new Error('Nhập tên dịch vụ.')
  if (!Number.isFinite(defaultPrice) || defaultPrice < 0) {
    throw new Error('Giá dịch vụ không hợp lệ.')
  }

  const payload = {
    name,
    category_id: String(formData.get('category_id') || '') || null,
    default_price: defaultPrice,
  }
  const { error } = id
    ? await supabase.from('services').update(payload).eq('id', id)
    : await supabase.from('services').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}
