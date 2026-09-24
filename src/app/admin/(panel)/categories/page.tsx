import Image from "next/image";
import { deleteCategoryAction, moveCategoryAction, toggleCategoryAction } from "@/app/admin/actions/categories";
import { AdminCard, AdminPageHeader, Badge } from "@/components/admin/AdminUI";
import { CategoryEditToggle, CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { ArrowDown, ArrowUp, GemIcon } from "@/components/icons";
import { Notice } from "@/components/ui/Notice";
import { requireAdminPage } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string; deleted?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <AdminPageHeader title="Categories" description="Organise the catalogue. The first five active categories marked “Show in navigation” appear in the main menu." />
      {sp.error && <Notice tone="error" className="mb-6">{sp.error.slice(0, 300)}</Notice>}
      {sp.deleted && <Notice tone="success" className="mb-6">Category deleted.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <section className="card-surface" aria-label="Category list">
          {categories.length === 0 ? (
            <p className="p-6 text-sm text-muted">No categories yet — create the first one.</p>
          ) : (
            <ol className="divide-y divide-sand">
              {categories.map((c, i) => (
                <li key={c.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-cream">
                      {c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : <GemIcon className="m-auto mt-3 text-stone" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{c.name}</p>
                      <p className="text-xs text-subtle">/{c.slug} · {c._count.products} product{c._count.products === 1 ? "" : "s"}</p>
                      <div className="mt-1 flex gap-1">
                        <Badge tone={c.isActive ? "green" : "grey"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                        {c.showInNav && <Badge tone="gold">In navigation</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <form action={moveCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button type="submit" disabled={i === 0} className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-cream disabled:opacity-30">
                          <ArrowUp size={16} /><span className="sr-only">Move {c.name} up</span>
                        </button>
                      </form>
                      <form action={moveCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button type="submit" disabled={i === categories.length - 1} className="inline-flex h-9 w-9 items-center justify-center rounded-sm hover:bg-cream disabled:opacity-30">
                          <ArrowDown size={16} /><span className="sr-only">Move {c.name} down</span>
                        </button>
                      </form>
                      <form action={toggleCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="active" value={c.isActive ? "false" : "true"} />
                        <button type="submit" className="btn btn-ghost btn-sm !px-2">{c.isActive ? "Deactivate" : "Activate"}</button>
                      </form>
                      {c._count.products === 0 && (
                        <ConfirmDeleteButton action={deleteCategoryAction} id={c.id} title={`Delete “${c.name}”?`} description="This category has no products and will be permanently removed." />
                      )}
                    </div>
                  </div>
                  <CategoryEditToggle
                    initial={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", imageUrl: c.imageUrl ?? "", isActive: c.isActive, showInNav: c.showInNav }}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        <AdminCard title="New category" className="xl:sticky xl:top-6 xl:self-start">
          <CategoryForm initial={{ name: "", slug: "", description: "", imageUrl: "", isActive: true, showInNav: false }} />
        </AdminCard>
      </div>
    </>
  );
}
