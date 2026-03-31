import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getSessionUser } from "@/lib/auth";

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Checkout</p>
          <h1>Thanh toán đơn hàng</h1>
        </div>
        <CheckoutForm />
      </div>
    </section>
  );
}
