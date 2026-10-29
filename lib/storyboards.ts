export type Storyboard = { id: string; title: string; filename: string; kind: "slide" | "reference" };
export const slides: Storyboard[] = Array.from({ length: 19 }, (_, index) => {
  const number = index + 2;
  return { id: `slide-${number}`, title: `Slide ${String(number).padStart(2, "0")}`, filename: `${number}.png`, kind: "slide" };
});
export const character: Storyboard = { id: "character-guide", title: "Karakter pemandu", filename: "karakter pemandu.png", kind: "reference" };
export const storyboards = [...slides, character];
export function imagePath(item: Storyboard) { return `/storyboards/${encodeURIComponent(item.filename)}`; }
