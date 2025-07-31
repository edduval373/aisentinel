import { useQuery } from "@tanstack/react-query";

interface VersionDisplayProps {
  className?: string;
  showTitle?: boolean;
}

interface Version {
  id: number;
  version: string;
  title?: string;
  releaseDate: string;
}

export default function VersionDisplay({ className = "", showTitle = false }: VersionDisplayProps) {
  const { data: version } = useQuery<Version>({
    queryKey: ['/api/version/current'],
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!version) return null;

  return (
    <div className={className} style={{ fontSize: '12px', color: '#6b7280' }}>
      {showTitle && version.title && (
        <span style={{ marginRight: '8px' }}>{version.title}</span>
      )}
      <span>v{version.version}</span>
    </div>
  );
}