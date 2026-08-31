type SourceCitationProps = {
  name: string | null;
  url: string | null;
};

export default function SourceCitation({ name, url }: SourceCitationProps) {
  if (!name) return null;

  return (
    <span className='text-secondary-foreground'>
      {url ? (
        <a href={url} target='_blank' rel='noopener noreferrer' className='text-link underline-offset-2 hover:underline'>
          {name}
        </a>
      ) : (
        name
      )}
    </span>
  );
}
