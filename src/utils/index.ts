import { AutoModel, AutoProcessor, env, PreTrainedModel, Processor, RawImage } from '@huggingface/transformers';


// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false;

// Proxy the WASM backend to prevent the UI from freezing
env.backends.onnx.wasm.proxy = true;

export class Model {
  static model: PreTrainedModel
  static processor: Processor

  static toDataURL(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
  
      // Set up a callback when the file is loaded
      reader.onload = e => resolve(e.target?.result as string);
  
      reader.readAsDataURL(file);
    })
  }

  static toImageURL (offscreen: OffscreenCanvas) {
    return new Promise((resolve, reject) => {
      // 将 OffscreenCanvas 转换为 Blob 对象
      offscreen.convertToBlob().then(blob => {

        resolve(URL.createObjectURL(blob))
      }).catch(error => {
        console.error('Error converting OffscreenCanvas to URL:', error);
        reject(error)
      });
    })
  }

  static async loadModel() {
    if (!this.model) {
      this.model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
        // Do not require config.json to be present in the repository
        config: { model_type: 'custom' },
        device: 'webgpu',
        dtype: 'fp32',
      });
    }
  
    if (!this.processor) {
      this.processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
          // Do not require config.json to be present in the repository
          config: {
              do_normalize: true,
              do_pad: false,
              do_rescale: true,
              do_resize: true,
              image_mean: [0.5, 0.5, 0.5],
              feature_extractor_type: "ImageFeatureExtractor",
              image_std: [1, 1, 1],
              resample: 2,
              rescale_factor: 0.00392156862745098,
              size: { width: 1024, height: 1024 },
          }
      });
    }
  }

  static async processImage(file: string | File) {
    if (file instanceof File) {
      file = await this.toDataURL(file)
    }
    await this.loadModel();
    // Read image
    const image = await RawImage.fromURL(file);

    const start = performance.now();

    // Preprocess image
    const { pixel_values } = await this.processor(image);

    // Predict alpha matte
    const { output } = await this.model({ input: pixel_values });

    // Resize mask back to original size
    const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height);

    console.log('消耗时间:', performance.now() - start);

    // Create new canvas
    const offscreenCanvas = new OffscreenCanvas(image.width, image.height)
    const ctx = offscreenCanvas.getContext('2d');

    if (!ctx) {
      console.error('不支持OffscreenCanvas')
      return
    }

    // Draw original image output to canvas
    ctx.drawImage(image.toCanvas(), 0, 0);

    console.log('消耗时间:', performance.now() - start);

    // Update alpha channel
    const pixelData = ctx.getImageData(0, 0, image.width, image.height);
    for (let i = 0; i < mask.data.length; ++i) {
        pixelData.data[4 * i + 3] = mask.data[i];
    }
    ctx.putImageData(pixelData, 0, 0);

    return this.toImageURL(offscreenCanvas);
  }
}

interface FileUploadOptions {
  accept: string
  multiple: boolean
  max?: string
}

// 文件上传
export const selectFile = (options: FileUploadOptions): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    // 创建input[file]元素
    const input = document.createElement('input')
    // 设置相应属性
    input.setAttribute('type', 'file')
    input.setAttribute('accept', options.accept)
    options.multiple
      ? input.setAttribute('multiple', 'multiple')
      : input.removeAttribute('multiple')
    // 绑定事件
    input.onchange = function (event) {

      const input = event.target as HTMLInputElement;
      // 获取文件列表
      if (input?.files) {
        const files = Array.from(input.files)
        resolve(files)
      } else {
        reject(new Error('No files selected'))
      }
    }

    input.oncancel = function () {
      reject(new Error('No files selected'))
    }
    input.click()
  })
}