type EmbedPlaceholderProps = {
  title: string;
};

export function EmbedPlaceholder({ title }: EmbedPlaceholderProps) {
  return (
    <main className="mx-auto w-full max-w-lg p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
    </main>
  );
}
