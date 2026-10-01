import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderDetailClient from "./OrderDetailClient";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, created_at, customer_id, total,
       customers ( id, name, phone ),
       order_items (
         id, item_type, quantity, unit_price, fulfillment_status,
         products ( id, name ),
         services ( id, name ),
         licenses ( id, product_name )
       )`,
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  return <OrderDetailClient order={order as any} />;
}
