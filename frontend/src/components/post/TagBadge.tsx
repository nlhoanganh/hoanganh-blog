interface Props {
  name: string;
}

const COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
];

function colorForTag(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xff;
  return COLORS[hash % COLORS.length];
}

export default function TagBadge({ name }: Props) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorForTag(name)}`}>
      {name}
    </span>
  );
}
