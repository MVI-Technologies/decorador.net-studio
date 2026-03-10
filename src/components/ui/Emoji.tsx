import Twemoji from "react-twemoji";

interface EmojiProps {
  children: string;
  className?: string;
}

export function Emoji({ children, className }: EmojiProps) {
  return (
    <Twemoji
      tag="span"
      options={{
        className: `twemoji${className ? ` ${className}` : ""}`,
        ext: ".svg",
        folder: "svg",
        base: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/",
      }}
    >
      <span role="img" aria-label={children}>
        {children}
      </span>
    </Twemoji>
  );
}
