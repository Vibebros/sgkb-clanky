import Image from "next/image";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-semibold text-gray-900 sm:text-3xl">
          {title}
        </h1>
        <Image
          src="/sgkb/logo-sgkb.jpg"
          alt="SGKB logo"
          width={120}
          height={36}
          className="h-8 w-auto shrink-0 object-contain sm:h-10"
          priority
        />
      </div>
      {subtitle ? (
        <p className="text-sm text-gray-500 max-w-xl">{subtitle}</p>
      ) : null}
    </div>
  );
}
