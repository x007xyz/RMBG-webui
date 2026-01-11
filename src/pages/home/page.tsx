import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { ImageDown, ImageUp, MoveHorizontal } from "lucide-react"
import { selectFile, Model } from "@/utils"
import { useEffect, useRef, useState, useCallback } from "react"
import Loading from "./components/Loading"
import Loading2 from "./components/Loading2"

const HomePage = () => {

  const [loadingModel, setLoadingModel] = useState(true)
  
  const [sourceImage, setSourceImage] = useState('')

  const [processImage, setProcessImage] = useState('')

  // Slider position (0 to 100)
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Model.loadModel().then(() => {
      // 模型加载完成
      setLoadingModel(false)
    })
  }, [])

  function onUpload () {
    setSourceImage("")
    setProcessImage("")
    // Reset slider to 0 (left) initially
    setSliderPos(0)
    setIsAnimating(false)
    
    selectFile({ accept: 'image/*', multiple: false }).then(files => {
      Model.toDataURL(files[0]).then(url => {
        setSourceImage(url)
      })
      return Model.processImage(files[0])
    }).then(url => {
      setProcessImage(url)
      // Animate slider to 50%
      setIsAnimating(true)
      // Slight delay to ensure render happens before transition
      requestAnimationFrame(() => {
        setSliderPos(50)
      })
      
      // Stop animating state after transition (assuming 1s duration)
      setTimeout(() => {
        setIsAnimating(false)
      }, 1000)
    })
  }

  function onDownLoad() {
    const a = document.createElement('a');
    a.href = processImage;
    a.download = `${Date.now()}.png`; // 指定下载的文件名

    a.click()
  }

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
    setIsAnimating(false) // Stop animation if user grabs it
  }, [])

  const handleTouchStart = useCallback(() => {
    setIsDragging(true)
    setIsAnimating(false)
  }, [])

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
        setSliderPos(percentage)
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault()
        handleMove(e.clientX)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        // e.preventDefault() // prevent scrolling while dragging
        handleMove(e.touches[0].clientX)
      }
    }

    const onEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onEnd)
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', onEnd)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging])

  return (
    <div className="mx-auto max-w-2xl p-6 select-none">
      <div 
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border bg-muted"
      >
        <AspectRatio ratio={4 / 3} className="flex items-center justify-center">
          
          {/* Base Layer: Processed Image (Right Side Content, visible on the right) */}
          {/* We show processed image as the background/full layer. */}
          {/* Requirement: Left is Original, Right is Processed. */}
          {/* So if we clip the top layer (Original) from the right, the bottom layer (Processed) shows through on the right. */}
          
          {/* Checkerboard background for transparency */}
          <div className="absolute inset-0 bg-checkerboard w-full h-full" />

          {/* Processed Image (Bottom Layer) */}
          {processImage && (
             <img 
               className="object-contain w-full h-full absolute inset-0 pointer-events-none" 
               src={processImage} 
               alt="Processed" 
             />
          )}

          {/* Original Image (Top Layer) - Clipped */}
          {/* Only render if we have a source image. If we only have source (start), show it fully? */}
          {/* If source exists but process doesn't, we show source fully (or handle waiting state). */}
          {sourceImage && (
            <div 
              className={`absolute inset-0 w-full h-full overflow-hidden ${isAnimating ? 'transition-[clip-path] duration-1000 ease-out' : ''}`}
              style={{
                clipPath: processImage ? `inset(0 ${100 - sliderPos}% 0 0)` : 'none'
              }}
            >
              <img 
                className="object-contain w-full h-full absolute inset-0 pointer-events-none" 
                src={sourceImage} 
                alt="Original" 
              />
            </div>
          )}
          
          {/* Loading State */}
          {sourceImage && !processImage && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                <Loading2 />
             </div>
          )}

          {/* Slider Handle */}
          {sourceImage && processImage && (
            <div 
              className={`absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20 flex items-center justify-center shadow-lg ${isAnimating ? 'transition-all duration-1000 ease-out' : ''}`}
              style={{ left: `${sliderPos}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border text-muted-foreground">
                <MoveHorizontal size={16} />
              </div>
            </div>
          )}

        </AspectRatio>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <Button onClick={onUpload} disabled={loadingModel}>
          { loadingModel ? <><Loading></Loading>初始化</> : <><ImageUp className="mr-2"/>上传图片</> }
        </Button>
        <Button variant={'outline'} disabled={!processImage} onClick={onDownLoad}>
          <ImageDown className="mr-2"/>
          下载图片
        </Button>
      </div>
    </div>
  )
}

export default HomePage
