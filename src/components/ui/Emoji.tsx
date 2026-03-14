interface EmojiProps {
  children: string;
  className?: string;
}

export function Emoji({ children, className }: EmojiProps) {
  return (
    <span role="img" aria-label={children} className={className}>
      {children}
    </span>
  );
}
