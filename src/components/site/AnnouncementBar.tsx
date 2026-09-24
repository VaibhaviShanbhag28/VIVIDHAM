import Link from "next/link";

export function AnnouncementBar({ text, link }: { text: string | null; link: string | null }) {
  if (!text) return null;
  const content = <span className="tracking-[0.12em]">{text}</span>;
  return (
    <div className="bg-emerald-900 text-center text-[0.7rem] font-medium uppercase text-gold-100 sm:text-xs">
      <div className="container-page py-2.5">
        {link ? (
          link.startsWith("/") ? (
            <Link href={link} className="hover:text-white hover:underline underline-offset-4">
              {content}
            </Link>
          ) : (
            <a href={link} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline underline-offset-4">
              {content}
            </a>
          )
        ) : (
          content
        )}
      </div>
    </div>
  );
}
