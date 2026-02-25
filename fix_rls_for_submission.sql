-- 1. 修复评价提交权限 (teacher_reviews)
-- 允许插入
drop policy if exists "Enable insert for teacher_reviews" on public.teacher_reviews;
create policy "Enable insert for teacher_reviews" on public.teacher_reviews for insert with check (true);

-- 允许读取
drop policy if exists "Enable select for teacher_reviews" on public.teacher_reviews;
create policy "Enable select for teacher_reviews" on public.teacher_reviews for select using (true);


-- 2. 修复统计同步权限 (teachers 表的平均分和评论数更新)
-- 因为代码中 submitTeacherReview 之后会调用 updateTeacherStats，涉及对 teachers 表的 update
drop policy if exists "Enable update for anyone" on public.teachers;
create policy "Enable update for anyone" on public.teachers for update using (true);


-- 3. 修复点赞功能权限 (teacher_review_likes)
drop policy if exists "Enable insert for likes" on public.teacher_review_likes;
create policy "Enable insert for likes" on public.teacher_review_likes for insert with check (true);

drop policy if exists "Enable select for likes" on public.teacher_review_likes;
create policy "Enable select for likes" on public.teacher_review_likes for select using (true);

drop policy if exists "Enable delete for likes" on public.teacher_review_likes;
create policy "Enable delete for likes" on public.teacher_review_likes for delete using (true);
