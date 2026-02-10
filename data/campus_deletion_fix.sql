-- 1. 为帖子增加删除策略
-- 允许作者本人或演示账号删除帖子
DROP POLICY IF EXISTS "Users can delete own posts." ON public.posts;
CREATE POLICY "Users can delete own posts." ON public.posts 
FOR DELETE USING ( auth.uid() = author_id OR author_id = 'd3b07384-dead-4bef-cafe-000000000000' );

-- 2. 为评论增加删除策略
-- 允许作者本人或演示账号删除评论
DROP POLICY IF EXISTS "Users can delete own comments." ON public.post_comments;
CREATE POLICY "Users can delete own comments." ON public.post_comments 
FOR DELETE USING ( auth.uid() = author_id OR author_id = 'd3b07384-dead-4bef-cafe-000000000000' );
