-- 1. 允许匿名用户删除教师数据（用于去重同步前清理）
-- 注意：如果提示策略已存在，可以忽略或使用下面这一行先删除再创建
-- drop policy if exists "Enable delete for anonymous users" on public.teachers;
create policy "Enable delete for anonymous users" on public.teachers for delete using (true);

-- 2. 检查并确保其他策略也存在（可选）
-- create policy "Enable insert for anonymous users" on public.teachers for insert with check (true);
-- create policy "Enable update for anonymous users" on public.teachers for update using (true);
