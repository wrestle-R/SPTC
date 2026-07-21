type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
    </header>
  );
}
