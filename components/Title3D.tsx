// A page title set in 3D lettering. The picture carries the words as its alt text, so screen readers and search
// engines still read an ordinary heading.
type Props = {
  src: string
  alt: string
  maxWidth?: number
  marginTop?: number
  marginBottom?: number
  as?: 'h1' | 'h2'
}

export default function Title3D({ src, alt, maxWidth = 520, marginTop = 0, marginBottom = 24, as = 'h1' }: Props) {
  const Tag = as
  return (
    <Tag style={{ margin: `${marginTop}px auto ${marginBottom}px`, textAlign: 'center', lineHeight: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        decoding="async"
        style={{ display: 'inline-block', width: '100%', maxWidth, height: 'auto', filter: 'drop-shadow(0 10px 18px rgba(0,0,0,.55))' }}
      />
    </Tag>
  )
}
