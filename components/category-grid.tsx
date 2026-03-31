import Link from "next/link";
import { Headphones, Laptop, Monitor, MonitorSmartphone, Smartphone } from "lucide-react";
import { Category, CategoryIcon } from "@/lib/types";

const iconMap = {
  Laptop,
  Monitor,
  Smartphone,
  Headphones,
  MonitorSmartphone,
} satisfies Record<CategoryIcon, typeof Laptop>;

export function CategoryGrid({ items }: { items: Category[] }) {
  return (
    <div className="category-grid">
      {items.map((category) => {
        const Icon = iconMap[category.icon] ?? Monitor;
        return (
          <Link key={category.id} href={`/products?category=${category.id}`} className="card category-card">
            <Icon size={28} />
            <h3>{category.name}</h3>
            <p>{category.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
