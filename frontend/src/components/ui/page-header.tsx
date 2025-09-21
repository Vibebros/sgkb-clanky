import Image from "next/image";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
        <Image
          src="/sgkb/logo-sgkb.jpg"
          alt="SGKB logo"
          width={128}
          height={32}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>
      {subtitle ? (
        <p className="text-sm text-gray-500 max-w-xl">{subtitle}</p>
      ) : null}
    </div>
  );
}
