import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ImageUp, SeparatorVertical } from "lucide-react"
import Split from "./Split"

const DropUpload = () => {
  return (<AspectRatio ratio={16 / 9} className="bg-muted rounded-lg relative">
    {/* <img
      src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
      alt="Photo by Drew Beamer"
      className="rounded-md object-cover"
    /> */}
    <div className="h-full flex flex-col items-center justify-center">
      <ImageUp size={48} className="mb-4"/>
      <p className="text-lg">点击或者拖拽上传图片</p>
    </div>
    <Split></Split>
    <div className="absolute top-0 bottom-0 w-1 left-10 bg-slate-200">
      <SeparatorVertical />
    </div>
  </AspectRatio>)
}

export default DropUpload