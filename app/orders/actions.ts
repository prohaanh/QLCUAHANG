"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ----- Helpers -----

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { data: linkedProfile } = await supabase
      .from("users")
      .select("id, role, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    profile = linkedProfile;
  }

  if (!profile || profile.is_active === false) redirect("/login");

  return { supabase, profile };
}

export type ActionResult = { error?: string; success?: boolean };

// ----- Tạo đơn hàng mới (trạng thái mở) -----

export async function createOrder(formData: FormData): Promise<void> {
  const { supabase, profile } = await requireUser();
  const customerId = String(formData.get("customer_id") || "") || null;

  if (customerId) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .maybeSingle();
    if (customerError || !customer) redirect("/orders?error=customer");
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_id: customerId,
      status: "mo",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/orders?error=create");
  }

  revalidatePath("/orders");
  redirect(`/orders/${data.id}`);
}

// ----- Thêm 1 dòng hàng vào đơn (sản phẩm / dịch vụ / license) -----

export async function addOrderItem(formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const orderId = String(formData.get("order_id"));
  const itemType = String(formData.get("item_type")) as "product" | "service" | "license";
  const refId = String(formData.get("ref_id"));
  const quantity = Number(formData.get("quantity"));
  const submittedPrice = Number(formData.get("unit_price") ?? 0);

  if (!orderId || !refId || !["product", "service", "license"].includes(itemType)) {
    return { error: "Thiếu hoặc sai thông tin mặt hàng." };
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Số lượng phải là số nguyên lớn hơn 0." };
  }
  if (!Number.isFinite(submittedPrice) || submittedPrice < 0) {
    return { error: "Giá mặt hàng không hợp lệ." };
  }

  // Đơn phải còn ở trạng thái "mo" mới cho thêm dòng
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "mo") {
    return { error: "Đơn đã đóng, không thể thêm hàng" };
  }

  // Xác định fulfillment_status ban đầu:
  // - service/license: luôn coi như "du_hang" (không quản lý tồn kho)
  // - product: kiểm tra tồn kho, nếu đủ hàng thì "du_hang", thiếu thì "dat_truoc"
  let fulfillmentStatus: "du_hang" | "dat_truoc" = "du_hang";
  let unitPrice = submittedPrice;

  if (itemType === "product") {
    const { data: product } = await supabase
      .from("products")
      .select("price, stock_qty")
      .eq("id", refId)
      .maybeSingle();

    if (!product) return { error: "Không tìm thấy sản phẩm." };
    unitPrice = Number(product.price);
    if (product.stock_qty < quantity) {
      fulfillmentStatus = "dat_truoc";
    }
  } else if (itemType === "service") {
    const { data: service } = await supabase
      .from("services")
      .select("default_price")
      .eq("id", refId)
      .maybeSingle();
    if (!service) return { error: "Không tìm thấy dịch vụ." };
    unitPrice = Number(service.default_price);
  } else {
    const { data: license } = await supabase
      .from("licenses")
      .select("id")
      .eq("id", refId)
      .maybeSingle();
    if (!license) return { error: "Không tìm thấy license." };
  }

  const row: Record<string, unknown> = {
    order_id: orderId,
    item_type: itemType,
    quantity,
    unit_price: unitPrice,
    fulfillment_status: fulfillmentStatus,
  };
  if (itemType === "product") row.product_id = refId;
  if (itemType === "service") row.service_id = refId;
  if (itemType === "license") row.license_id = refId;

  const { error } = await supabase.from("order_items").insert(row);
  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function removeOrderItem(orderItemId: string, orderId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!order || order.status !== "mo") {
    return { error: "Đơn đã đóng, không thể sửa" };
  }

  const { error } = await supabase
    .from("order_items")
    .delete()
    .eq("id", orderItemId)
    .eq("order_id", orderId);
  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

// ----- Đổi trạng thái thanh toán của đơn -----
// Trigger DB (auto_deduct_stock_on_paid) sẽ tự trừ kho cho các item item_type='product'
// đang ở fulfillment_status='du_hang' khi status chuyển sang 'da_thanh_toan'.

export async function updateOrderStatus(
  orderId: string,
  status: "mo" | "da_thanh_toan" | "huy",
): Promise<ActionResult> {
  const { supabase } = await requireUser();

  if (!["mo", "da_thanh_toan", "huy"].includes(status)) {
    return { error: "Trạng thái đơn hàng không hợp lệ." };
  }

  const { data: current, error: readError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (readError || !current) return { error: readError?.message ?? "Không tìm thấy đơn hàng." };
  if (current.status === status) return { success: true };
  if (current.status !== "mo" || status === "mo") {
    return { error: "Đơn đã thanh toán hoặc đã hủy, không thể đổi trạng thái." };
  }

  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("status", "mo")
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!updated) {
    const { data: latest } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .maybeSingle();
    if (latest?.status !== status) {
      return { error: "Đơn vừa được cập nhật ở nơi khác. Hãy tải lại trang." };
    }
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { success: true };
}

// ----- Đổi trạng thái giao hàng của 1 dòng: "dat_truoc" -> "da_giao" khi hàng về -----
// Trigger DB (auto_deduct_stock_on_fulfilled) sẽ tự trừ kho khi chuyển sang "da_giao"
// nếu đơn đã "da_thanh_toan".

export async function updateItemFulfillment(
  orderItemId: string,
  orderId: string,
  fulfillmentStatus: "dat_truoc" | "du_hang" | "da_giao",
): Promise<ActionResult> {
  const { supabase } = await requireUser();

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status !== "da_thanh_toan") {
    return { error: "Chỉ cập nhật giao hàng sau khi đơn đã thanh toán." };
  }

  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id, fulfillment_status")
    .eq("id", orderItemId)
    .eq("order_id", orderId)
    .maybeSingle();
  if (itemError || !item) return { error: itemError?.message ?? "Không tìm thấy mặt hàng trong đơn." };
  if (item.fulfillment_status === fulfillmentStatus) return { success: true };
  if (item.fulfillment_status === "da_giao") {
    return { error: "Mặt hàng đã giao không thể chuyển ngược trạng thái." };
  }
  if (item.fulfillment_status === "du_hang" && fulfillmentStatus === "dat_truoc") {
    return { error: "Không thể đổi hàng đã đủ sang đặt trước sau khi thanh toán." };
  }
  if (item.fulfillment_status === "dat_truoc" && fulfillmentStatus === "du_hang") {
    return { error: "Đơn đã thanh toán; hãy chuyển hàng đặt trước sang đã giao khi hoàn tất." };
  }

  const { error } = await supabase
    .from("order_items")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", orderItemId)
    .eq("order_id", orderId)
    .eq("fulfillment_status", item.fulfillment_status);

  if (error) return { error: error.message };

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

// ----- Tìm sản phẩm/dịch vụ/license để thêm vào đơn -----

export async function searchCatalog(itemType: "product" | "service" | "license", query: string) {
  const { supabase } = await requireUser();

  if (itemType === "product") {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, stock_qty, barcode")
      .ilike("name", `%${query}%`)
      .limit(10);
    return data ?? [];
  }

  if (itemType === "service") {
    const { data } = await supabase
      .from("services")
      .select("id, name, default_price")
      .ilike("name", `%${query}%`)
      .limit(10);
    return data ?? [];
  }

  const { data } = await supabase
    .from("licenses")
    .select("id, product_name")
    .ilike("product_name", `%${query}%`)
    .limit(10);
  return data ?? [];
}
