import { CallPriority, CallStatus, WeaponsPresent } from '../types';

export function formatISODate(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

export function getRelativeTime(isoString: string): string {
  const now = new Date();
  const time = new Date(isoString);
  const secondsAgo = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
  return `${Math.floor(secondsAgo / 86400)}d ago`;
}

export function getElapsedTime(startTime: string): string {
  const now = new Date();
  const start = new Date(startTime);
  const secondsElapsed = Math.floor((now.getTime() - start.getTime()) / 1000);

  const hours = Math.floor(secondsElapsed / 3600);
  const minutes = Math.floor((secondsElapsed % 3600) / 60);
  const seconds = secondsElapsed % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

export function getPriorityColor(priority: CallPriority): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getSeverityColor(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function getStatusBadge(status: CallStatus): { label: string; color: string } {
  switch (status) {
    case 'ai_handling':
      return { label: 'AI Active', color: 'bg-blue-100 text-blue-800' };
    case 'human_active':
      return { label: 'Human Active', color: 'bg-purple-100 text-purple-800' };
    case 'closed':
      return { label: 'Closed', color: 'bg-gray-100 text-gray-800' };
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  }
}

export function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  if (confidence >= 0.4) return 'text-orange-600';
  return 'text-red-600';
}

export function formatConfidence(confidence?: number): string {
  if (confidence === undefined) return 'N/A';
  return `${Math.round(confidence * 100)}%`;
}

export function highlightCriticalKeywords(text: string): string {
  const keywords = [
    'bleeding',
    'unconscious',
    'shooting',
    'gun',
    'stabbing',
    'knife',
    'fire',
    'explosion',
    'not breathing',
    'severe',
    'critical',
    'emergency',
  ];

  let highlighted = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlighted = highlighted.replace(
      regex,
      `<mark class="bg-yellow-200 font-semibold">${keyword}</mark>`
    );
  });

  return highlighted;
}

export function clsx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
