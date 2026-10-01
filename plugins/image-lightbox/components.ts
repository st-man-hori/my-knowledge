// Tap/click an article image to view it full-screen in a modal. Diagrams
// shrink to ~20rem wide on phones, which makes their labels unreadable;
// the modal fits the image to the whole viewport, tapping it again zooms to
// 2x for panning, and the browser's own pinch-zoom still works too.
export const ImageLightbox = () => {
  // Renders nothing: the <dialog> is created by the script below so it
  // lives directly under <body>, outside the content Quartz swaps on SPA
  // navigation.
  const Component = () => null

  Component.css = `
article img.lightbox-target {
  cursor: zoom-in;
}
dialog.image-lightbox {
  width: 100vw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  overflow: auto;
  overscroll-behavior: contain;
}
dialog.image-lightbox::backdrop {
  background: rgb(0 0 0 / 0.85);
}
dialog.image-lightbox[open] {
  display: flex;
  animation: image-lightbox-in 0.15s ease-out;
}
dialog.image-lightbox img {
  max-width: calc(100vw - 2rem);
  max-height: calc(100dvh - 5rem);
  /* Auto margins center the image in the flex container but collapse to 0
     once the zoomed image overflows, so its left/top edges stay scrollable
     (justify-content: center would push them out of reach). */
  margin: auto;
  flex-shrink: 0;
  cursor: zoom-in;
  border-radius: 6px;
  /* Transparent SVG/PNG diagrams are drawn for the light page background
     and vanish against the dark backdrop without one of their own. */
  background: #fff;
  content-visibility: visible;
}
dialog.image-lightbox.zoomed img {
  max-width: none;
  max-height: none;
  cursor: zoom-out;
}
dialog.image-lightbox button {
  position: fixed;
  z-index: 1;
  top: max(0.75rem, env(safe-area-inset-top));
  right: 0.75rem;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.15);
  color: #fff;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
}
@keyframes image-lightbox-in {
  from { opacity: 0; }
}
`

  Component.beforeDOMLoaded = `
(() => {
  const resetZoom = (dialog) => {
    dialog.classList.remove("zoomed")
    dialog.querySelector("img").style.width = ""
    dialog.scrollTo(0, 0)
  }

  const getDialog = () => {
    let dialog = document.querySelector("dialog.image-lightbox")
    if (dialog) return dialog
    dialog = document.createElement("dialog")
    dialog.className = "image-lightbox"
    dialog.innerHTML = '<button type="button" aria-label="閉じる">×</button><img alt="">'
    const img = dialog.querySelector("img")
    // A wide diagram fitted to a portrait phone is barely bigger than it was
    // in the article, so tapping the image toggles a 2x view the reader can
    // pan around; tapping anywhere else (or ×) closes.
    dialog.addEventListener("click", (e) => {
      if (e.target !== img) {
        dialog.close()
        return
      }
      if (dialog.classList.contains("zoomed")) {
        resetZoom(dialog)
        return
      }
      const rect = img.getBoundingClientRect()
      const fx = (e.clientX - rect.left) / rect.width
      const fy = (e.clientY - rect.top) / rect.height
      img.style.width = rect.width * 2 + "px"
      dialog.classList.add("zoomed")
      // Keep the tapped point under the finger.
      const zoomed = img.getBoundingClientRect()
      dialog.scrollLeft += zoomed.left + fx * zoomed.width - e.clientX
      dialog.scrollTop += zoomed.top + fy * zoomed.height - e.clientY
    })
    dialog.addEventListener("close", () => {
      resetZoom(dialog)
      document.documentElement.style.overflow = ""
    })
    document.body.append(dialog)
    return dialog
  }

  const open = (e) => {
    const src = e.currentTarget
    const dialog = getDialog()
    const img = dialog.querySelector("img")
    img.src = src.currentSrc || src.src
    img.alt = src.alt
    // iOS Safari scrolls the page behind a modal dialog otherwise.
    document.documentElement.style.overflow = "hidden"
    dialog.showModal()
  }

  const setup = () => {
    // Skip images that are already links (they navigate somewhere) and
    // link-preview-card favicons/thumbnails.
    const imgs = document.querySelectorAll("article img:not(a img)")
    for (const img of imgs) {
      img.classList.add("lightbox-target")
      img.addEventListener("click", open)
      window.addCleanup(() => img.removeEventListener("click", open))
    }
  }

  document.addEventListener("nav", () => {
    document.querySelector("dialog.image-lightbox[open]")?.close()
    setup()
  })
})()
`

  return Component
}
