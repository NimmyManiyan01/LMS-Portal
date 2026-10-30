import { useEffect, useRef } from "react"

interface TransparentLogoVideoProps {
  src: string
  className?: string
  loop?: boolean
  playbackRate?: number
  onEnded?: () => void
  onError?: () => void
}

export function TransparentLogoVideo({
  src,
  className = "",
  loop = false,
  playbackRate = 1,
  onEnded,
  onError,
}: TransparentLogoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) {
      onError?.()
      return
    }

    const drawFrame = () => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const frame = context.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = frame.data

        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index]
          const green = pixels[index + 1]
          const blue = pixels[index + 2]
          const brightness = Math.max(red, green, blue)

          // Remove black/dark background pixels with a soft edge while
          // retaining the saturated blue and green logo artwork.
          if (brightness <= 28) {
            pixels[index + 3] = 0
          } else if (brightness < 72) {
            pixels[index + 3] = Math.round(((brightness - 28) / 44) * 255)
          }
        }

        context.putImageData(frame, 0, 0)
      }

      if ((loop || !video.ended) && !video.paused) {
        frameRef.current = window.requestAnimationFrame(drawFrame)
      }
    }

    const prepareCanvas = () => {
      const aspectRatio = video.videoWidth / video.videoHeight || 16 / 9
      canvas.width = loop ? 320 : 800
      canvas.height = Math.round(canvas.width / aspectRatio)
      video.playbackRate = playbackRate
      void video.play().then(drawFrame).catch(() => onError?.())
    }

    video.addEventListener("loadeddata", prepareCanvas)
    return () => {
      video.removeEventListener("loadeddata", prepareCanvas)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [loop, onError, playbackRate, src])

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        muted
        loop={loop}
        playsInline
        preload="auto"
        className="sr-only"
        onEnded={loop ? undefined : onEnded}
        onError={onError}
        aria-hidden="true"
      />
      <canvas
        ref={canvasRef}
        className={className}
        role="img"
        aria-label="Kaizentrix Global Solutions logo reveal"
      />
    </>
  )
}
