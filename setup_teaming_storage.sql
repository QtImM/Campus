-- 创建 teaming-avatars 存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('teaming-avatars', 'teaming-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 允许所有用户上传文件
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'teaming-avatars' 
    AND auth.role() = 'authenticated'
);

-- 允许所有人读取文件（公开访问）
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'teaming-avatars');

-- 允许用户删除自己上传的文件
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'teaming-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
