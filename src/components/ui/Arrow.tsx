/**
 * Стрелка у текстовой ссылки. При наведении улетает вправо, а слева возвращается такая же
 * (две копии в окне с обрезкой; движение — .arrow в globals.css).
 * Линия той же толщины, что и линии сайта: 1px при любом масштабе.
 */
export function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      {[0, 1].map((copy) => (
        <svg key={copy} viewBox="0 0 24 9" focusable="false">
          <path d="M0 4.5h23.5M19.5 0.5l4 4-4 4" vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
    </span>
  )
}
