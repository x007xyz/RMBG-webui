import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ImageDown, ImageUp } from "lucide-react"
import { selectFile, Model } from "@/utils"
import { useEffect, useMemo, useState } from "react"
import Loading from "./components/Loading"
import Loading2 from "./components/Loading2"

const HomePage = () => {

  const [loadingModel, setLoadingModel] = useState(true)
  
  const [sourceImage, setSourceImage] = useState('')

  const [processImage, setProcessImage] = useState('')

  const [mode, setMode] = useState('source')

  const canSwitch = useMemo(() => !!processImage, [processImage])

  useEffect(() => {
    Model.loadModel().then(() => {
      // 模型加载完成
      setLoadingModel(false)
    })
  }, [])
  function onUpload () {
    setSourceImage("")
    setProcessImage("")
    setMode('source')
    selectFile({ accept: 'image/*', multiple: false }).then(files => {
      Model.toDataURL(files[0]).then(url => {
        setSourceImage(url)
      })
      return Model.processImage(files[0])
    }).then(url => {
      setProcessImage(url)
      setMode('process')
    })
  }

  function onCheckedChange(checked: boolean) {
    setMode(checked ? 'process' : 'source')
  }

  function onDownLoad() {
    const a = document.createElement('a');
    a.href = processImage;
    a.download = `${Date.now()}.png`; // 指定下载的文件名

    a.click()
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <AspectRatio ratio={4 / 3} className="bg-muted rounded-lg flex items-center justify-center">
        {mode === 'source' && sourceImage && <img className="object-contain w-full h-full absolute" src={sourceImage} alt="" />}
        {processImage && mode === 'process' && <img className="object-contain w-full h-full absolute" src={processImage} alt="" />}
        {sourceImage && !processImage && <Loading2></Loading2>}
        <div className="absolute bottom-4 right-4">
          <Switch id="airplane-mode" disabled={!canSwitch} checked={mode === 'process'} onCheckedChange={onCheckedChange}/>
        </div>
      </AspectRatio>
      <div className="mt-4 flex items-center">
        <Button onClick={onUpload} disabled={loadingModel}>
          { loadingModel ? <Loading></Loading> : <ImageUp className="mr-4"/> }
          上传图片
        </Button>
        <Button className="ml-6" variant={'outline'} disabled={!processImage} onClick={onDownLoad}>
          <ImageDown className="mr-4"/>
          下载图片
        </Button>
      </div>
    </div>
  )
}

export default HomePage