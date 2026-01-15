#!/usr/bin/env python3
"""
一键脚本：下载模型文件并上传到阿里云 OSS
使用方法: python3 scripts/setup-model-oss.py
"""

import os
import sys
import requests
from pathlib import Path

# 检查并导入 OSS SDK
try:
    import oss2
except ImportError:
    print("❌ 未安装 ali-oss，正在安装...")
    os.system("pip install oss2")
    import oss2

MODEL_NAME = "briaai/RMBG-1.4"
BASE_URL = "https://hf-mirror.com"
OUTPUT_DIR = Path("./models/RMBG-1.4")

# 需要下载的文件
FILES_TO_DOWNLOAD = [
    {
        "path": "onnx/model.onnx",
        "required": True,
        "description": "主要模型文件（约 88MB）"
    },
    {
        "path": "preprocessor_config.json",
        "required": False,
        "description": "配置文件（可选）"
    }
]

def download_file(url: str, output_path: Path, description: str = ""):
    """下载文件并显示进度"""
    print(f"\n📥 下载: {description or output_path.name}")
    print(f"   URL: {url}")
    
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 检查文件是否已存在
        if output_path.exists():
            size_mb = output_path.stat().st_size / 1024 / 1024
            print(f"   ⏭️  文件已存在 ({size_mb:.1f}MB)，跳过下载")
            return True
        
        response = requests.get(url, stream=True, timeout=600)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(output_path, 'wb') as f:
            chunk_size = 8192
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\r   进度: {percent:.1f}% ({downloaded / 1024 / 1024:.1f}MB / {total_size / 1024 / 1024:.1f}MB)", end='', flush=True)
        
        print(f"\n   ✅ 完成: {output_path}")
        return True
        
    except requests.exceptions.Timeout:
        print(f"\n   ❌ 超时: 下载失败")
        return False
    except requests.exceptions.RequestException as e:
        print(f"\n   ❌ 错误: {e}")
        return False

def upload_to_oss(local_path: Path, oss_path: str, oss_client, bucket_name: str):
    """上传文件到 OSS"""
    try:
        file_size_mb = local_path.stat().st_size / 1024 / 1024
        print(f"   📤 上传中 ({file_size_mb:.1f}MB)...", end='', flush=True)
        
        oss_client.put_object_from_file(oss_path, str(local_path))
        
        print(f" ✅")
        return True
    except Exception as e:
        print(f" ❌ 失败: {e}")
        return False

def get_oss_config():
    """获取 OSS 配置"""
    config = {
        'access_key_id': os.getenv('OSS_ACCESS_KEY_ID'),
        'access_key_secret': os.getenv('OSS_ACCESS_KEY_SECRET'),
        'endpoint': os.getenv('OSS_ENDPOINT', 'oss-cn-hangzhou.aliyuncs.com'),
        'bucket_name': os.getenv('OSS_BUCKET_NAME') or os.getenv('OSS_BUCKET'),
    }
    
    # 如果环境变量未设置，提示用户输入
    if not config['access_key_id']:
        print("\n" + "=" * 60)
        print("需要配置阿里云 OSS 信息")
        print("=" * 60)
        config['access_key_id'] = input("请输入 AccessKey ID: ").strip()
        config['access_key_secret'] = input("请输入 AccessKey Secret: ").strip()
        config['bucket_name'] = input("请输入 Bucket 名称: ").strip()
        endpoint_input = input("请输入地域端点 (默认: oss-cn-hangzhou.aliyuncs.com): ").strip()
        if endpoint_input:
            config['endpoint'] = endpoint_input
    
    if not all([config['access_key_id'], config['access_key_secret'], config['bucket_name']]):
        print("\n❌ 错误: OSS 配置不完整")
        print("\n可以通过环境变量设置:")
        print("  export OSS_ACCESS_KEY_ID='your-key-id'")
        print("  export OSS_ACCESS_KEY_SECRET='your-key-secret'")
        print("  export OSS_BUCKET_NAME='your-bucket-name'")
        print("  export OSS_ENDPOINT='oss-cn-hangzhou.aliyuncs.com'")
        sys.exit(1)
    
    return config


def main():
    print("=" * 60)
    print("RMBG-1.4 模型一键部署到阿里云 OSS")
    print("=" * 60)
    
    # 步骤 1: 下载模型文件
    print("\n【步骤 1/3】下载模型文件")
    print("-" * 60)
    print(f"模型: {MODEL_NAME}")
    print(f"镜像站点: {BASE_URL}")
    print(f"输出目录: {OUTPUT_DIR}")
    
    success_count = 0
    fail_count = 0
    
    for file_info in FILES_TO_DOWNLOAD:
        file_path = file_info["path"]
        url = f"{BASE_URL}/{MODEL_NAME}/resolve/main/{file_path}"
        output_path = OUTPUT_DIR / file_path
        
        success = download_file(url, output_path, file_info["description"])
        
        if success:
            success_count += 1
        else:
            fail_count += 1
            if file_info["required"]:
                print(f"\n❌ 必需文件下载失败，请检查网络连接后重试")
                print(f"   或者手动下载: {url}")
                sys.exit(1)
    
    print(f"\n✅ 下载完成: {success_count} 个文件")
    if fail_count > 0:
        print(f"⚠️  跳过: {fail_count} 个可选文件")
    
    # 步骤 2: 配置 OSS
    print("\n【步骤 2/3】配置阿里云 OSS")
    print("-" * 60)
    oss_config = get_oss_config()
    
    # 解析地域
    endpoint = oss_config['endpoint']
    if endpoint.startswith('oss-'):
        region = endpoint.replace('oss-', '').replace('.aliyuncs.com', '')
    else:
        region = 'cn-hangzhou'
    
    # 创建 OSS 客户端
    auth = oss2.Auth(oss_config['access_key_id'], oss_config['access_key_secret'])
    bucket = oss2.Bucket(auth, f'https://{endpoint}', oss_config['bucket_name'])
    
    # 测试连接
    try:
        print("🔍 测试 OSS 连接...", end='', flush=True)
        bucket.get_bucket_info()
        print(" ✅")
    except Exception as e:
        print(f" ❌")
        print(f"❌ OSS 连接失败: {e}")
        print("\n请检查:")
        print("  1. AccessKey ID 和 Secret 是否正确")
        print("  2. Bucket 名称是否正确")
        print("  3. 地域端点是否正确")
        print("  4. Bucket 是否存在且有访问权限")
        sys.exit(1)
    
    # 步骤 3: 上传文件
    print("\n【步骤 3/3】上传文件到 OSS")
    print("-" * 60)
    oss_prefix = "models/briaai/RMBG-1.4/resolve/main/"
    
    upload_success = 0
    upload_fail = 0
    
    for file_info in FILES_TO_DOWNLOAD:
        file_path = file_info["path"]
        local_path = OUTPUT_DIR / file_path
        
        if not local_path.exists():
            if file_info["required"]:
                print(f"\n❌ 文件不存在: {local_path}")
                sys.exit(1)
            else:
                continue
        
        oss_path = f"{oss_prefix}{file_path}"
        print(f"\n📤 上传: {file_path}")
        
        success = upload_to_oss(local_path, oss_path, bucket, oss_config['bucket_name'])
        
        if success:
            upload_success += 1
        else:
            upload_fail += 1
            if file_info["required"]:
                print(f"\n❌ 必需文件上传失败")
                sys.exit(1)
    
    print(f"\n✅ 上传完成: {upload_success} 个文件")
    if upload_fail > 0:
        print(f"⚠️  失败: {upload_fail} 个可选文件")
    
    # 完成
    print("\n" + "=" * 60)
    print("🎉 部署完成！")
    print("=" * 60)
    oss_url = f"https://{oss_config['bucket_name']}.{endpoint}"
    print(f"\n📁 模型文件已上传到 OSS:")
    print(f"   {oss_url}/{oss_prefix}onnx/model.onnx")
    print(f"\n💡 注意:")
    print(f"   项目代码已直接配置使用 OSS 地址，无需额外配置")
    print(f"\n🚀 下一步:")
    print(f"   1. 确保 OSS Bucket 已配置 CORS（允许跨域访问）")
    print(f"   2. 重启开发服务器: pnpm dev")
    print(f"   3. 查看浏览器控制台确认模型加载成功")
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  操作被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
