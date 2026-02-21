import os
for key in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']:
    os.environ.pop(key, None)
os.environ['NO_PROXY'] = '*'
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

from transformers import DonutProcessor
try:
    print('Testing DonutProcessor...')
    processor = DonutProcessor.from_pretrained('naver-clova-ix/donut-base-finetuned-cord-v2')
    print('Success!')
except Exception as e:
    import traceback
    traceback.print_exc()

