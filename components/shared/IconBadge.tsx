import { cn } from '@/lib/utils'

export type IconBadgeSize = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<IconBadgeSize, { box: string; icon: string }> = {
  sm: { box: 'w-10 h-10 rounded-lg', icon: 'h-5 w-5' },
  md: { box: 'w-16 h-16 rounded-xl', icon: 'h-7 w-7' },
  lg: { box: 'w-20 h-20 rounded-2xl', icon: 'h-8 w-8' },
}

interface IconBadgeProps {
  Icon: React.ComponentType<{ className?: string }>
  size?: IconBadgeSize
  className?: string
}

export function IconBadge({ Icon, size = 'md', className }: IconBadgeProps) {
  const s = SIZE_MAP[size]
  return (
    <div className={cn(s.box, 'shrink-0 aspect-square bg-primary/15 text-primary flex items-center justify-center', className)}>
      <Icon className={s.icon} />
    </div>
  )
}
