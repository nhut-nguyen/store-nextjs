import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
