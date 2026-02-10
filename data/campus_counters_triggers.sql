-- 1. Function to handle post comment count (with SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION handle_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post comments
DROP TRIGGER IF EXISTS on_post_comment_change ON public.post_comments;
CREATE TRIGGER on_post_comment_change
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION handle_post_comment_count();

-- 2. Function to handle post likes count (with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION handle_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts
        SET likes = likes + 1
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts
        SET likes = GREATEST(0, likes - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post likes
DROP TRIGGER IF EXISTS on_post_like_change ON public.post_likes;
CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION handle_post_likes_count();

-- 3. Enable Realtime for the posts table
-- This is critical so the app knows when the counter columns change!
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- 4. 一次性修复现有计数 (可选：将之前的错误计数清正)
UPDATE public.posts p
SET 
  likes = (SELECT count(*) FROM public.post_likes l WHERE l.post_id = p.id),
  comments_count = (SELECT count(*) FROM public.post_comments c WHERE c.post_id = p.id);
