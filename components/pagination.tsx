import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="pagination">
      {pages.map((page) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(searchParams)) {
          if (typeof value === "string" && value) {
            params.set(key, value);
          }
        }
        params.set("page", String(page));

        return (
          <Link
            key={page}
            href={`/products?${params.toString()}`}
            className={page === currentPage ? "page-link page-link-active" : "page-link"}
          >
            {page}
          </Link>
        );
      })}
    </div>
  );
}

