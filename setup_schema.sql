-- 复制以下所有代码
-- 进入 Supabase Dashboard -> SQL Editor
-- 点击 "New Query"，粘贴并在右下角点击 "Run"

-- 1. 创建用户档案表 (Public Profiles)
create table public.users (
  id uuid references auth.users not null primary key,
  display_name text,
  major text,
  avatar_url text,
  social_tags jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 开启用户表安全策略
alter table public.users enable row level security;
create policy "Public profiles are viewable by everyone." on public.users for select using ( true );
create policy "Users can insert their own profile." on public.users for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.users for update using ( auth.uid() = id );

-- 2. 创建帖子表 (Posts)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  content text,
  type text,
  author_id uuid references public.users(id),
  author_name text,
  author_avatar text,
  author_major text,
  author_tags jsonb,
  images jsonb,
  location_tag text,
  lat float,
  lng float,
  likes int default 0,
  comments_count int default 0,
  is_anonymous boolean default false,
  created_at timestamptz default now()
);

-- 开启帖子表安全策略
alter table public.posts enable row level security;
create policy "Posts are viewable by everyone." on public.posts for select using ( true );
create policy "Authenticated users or demo user can insert posts." on public.posts for insert with check ( auth.role() = 'authenticated' or author_id = 'd3b07384-dead-4bef-cafe-000000000000' );
create policy "Users can update own posts." on public.posts for update using ( auth.uid() = author_id );

-- 新增：帖子评论表
create table public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  author_id uuid references public.users(id),
  author_name text not null,
  author_avatar text,
  content text not null,
  created_at timestamptz default now()
);
alter table public.post_comments enable row level security;
create policy "Comments are viewable by everyone." on public.post_comments for select using ( true );
create policy "Authenticated users or demo user can comment." on public.post_comments for insert with check ( auth.role() = 'authenticated' or author_id = 'd3b07384-dead-4bef-cafe-000000000000' );

-- 新增：帖子点赞表
create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.users(id),
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
create policy "Likes are viewable by everyone." on public.post_likes for select using ( true );
create policy "Authenticated users or demo user can like." on public.post_likes for insert with check ( auth.role() = 'authenticated' or user_id = 'd3b07384-dead-4bef-cafe-000000000000' );
create policy "Users or demo user can unlike." on public.post_likes for delete using ( auth.uid() = user_id or user_id = 'd3b07384-dead-4bef-cafe-000000000000' );

-- 3. 创建互动表 (Interactions: Poke/Wave) - 可选
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references public.users(id),
  to_user_id uuid references public.users(id),
  type text,
  message text,
  created_at timestamptz default now(),
  read boolean default false
);
alter table public.interactions enable row level security;
create policy "Users can see interactions sent to them." on public.interactions for select using ( auth.uid() = to_user_id );
create policy "Users can insert interactions." on public.interactions for insert with check ( auth.role() = 'authenticated' );

-- 4. 聊天消息表 (Messages) - 可选
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id text,
  sender_id uuid references public.users(id),
  content text,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "Public read messages" on public.messages for select using (true); -- 简化版，实际应限制房间成员
create policy "Auth send messages" on public.messages for insert with check ( auth.role() = 'authenticated' );

-- 5. 配置 Storage (存储图片)
-- 注意：如果这段报错，说明你可能需要去 Storage 界面手动点一下 "Create new bucket" 并命名为 "posts"
insert into storage.buckets (id, name, public) values ('posts', 'posts', true);
create policy "Public Access" on storage.objects for select using ( bucket_id = 'posts' );
-- 6. 创建课程表 (Courses)
create table public.courses (
  id text default gen_random_uuid()::text primary key,
  code text unique not null,
  name text,
  instructor text,
  department text,
  credits int default 3,
  rating float default 0,
  review_count int default 0,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;
create policy "Courses are viewable by everyone." on public.courses for select using ( true );
create policy "Anyone can insert courses." on public.courses for insert with check ( true );

-- 7. 课程消息扩展 (Messages Table Already Exists, we use room_id for courses)
-- 8. 课程评价表 (Course Reviews)
create table public.course_reviews (
  id uuid default gen_random_uuid() primary key,
  course_id text references public.courses(id) on delete cascade,
  author_id uuid references public.users(id),
  author_name text,
  author_avatar text,
  rating int check (rating >= 1 and rating <= 5),
  difficulty int check (difficulty >= 1 and difficulty <= 5),
  content text,
  semester text,
  likes int default 0,
  created_at timestamptz default now()
);

alter table public.course_reviews enable row level security;
create policy "Reviews are viewable by everyone." on public.course_reviews for select using ( true );
create policy "Anyone can insert reviews." on public.course_reviews for insert with check ( true );

-- 自动更新课程评分的简单函数 (在实际应用中更推荐使用 Supabase Edge Functions or Triggers)
-- 这里仅作为参考，手动更新即可满足当前需求

-- 开启实时推送 (Realtime)
alter publication supabase_realtime add table messages;

-- 点赞自增/自减函数 (RPC)
create or replace function public.increment_review_likes(review_id uuid)
returns void as $$
begin
  update public.course_reviews
  set likes = likes + 1
  where id = review_id;
end;
$$ language plpgsql security definer;

create or replace function public.decrement_review_likes(review_id uuid)
returns void as $$
begin
  update public.course_reviews
  set likes = case when likes > 0 then likes - 1 else 0 end
  where id = review_id;
end;
$$ language plpgsql security definer;

-- 9. 课程交换表 (Course Exchanges)
create table public.course_exchanges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  user_name text,
  user_avatar text,
  user_major text,
  have_course text,
  have_section text,
  have_teacher text,
  have_time text,
  want_courses jsonb,
  reason text,
  contacts jsonb,
  status text default 'open',
  comment_count int default 0,
  likes int default 0,
  created_at timestamptz default now()
);

alter table public.course_exchanges enable row level security;
create policy "Exchanges are viewable by everyone." on public.course_exchanges for select using ( true );
create policy "Anyone can insert exchange requests." on public.course_exchanges for insert with check ( true );

-- 10. 课程交换评论表 (Exchange Comments)
create table public.exchange_comments (
  id uuid default gen_random_uuid() primary key,
  exchange_id uuid references public.course_exchanges(id) on delete cascade,
  author_id uuid references public.users(id),
  author_name text,
  author_avatar text,
  content text,
  created_at timestamptz default now()
);

alter table public.exchange_comments enable row level security;
create policy "Comments are viewable by everyone." on public.exchange_comments for select using ( true );
create policy "Anyone can insert exchange comments." on public.exchange_comments for insert with check ( true );

-- 11. 评论数自增函数 (RPC)
create or replace function public.increment_exchange_comment_count(row_id uuid)
returns void as $$
begin
  update public.course_exchanges
  set comment_count = comment_count + 1
  where id = row_id;
end;
$$ language plpgsql security definer;


-- 12. 建筑位置表 (Buildings)
create table public.buildings (
  id text primary key,
  name text not null,
  category text,
  description text,
  image_url text,
  lat float,
  lng float,
  is_deleted boolean default false,
  updated_at timestamptz default now()
);

alter table public.buildings enable row level security;
create policy "Buildings are viewable by everyone." on public.buildings for select using ( true );
create policy "Only authenticated users can insert/update buildings." on public.buildings 
  for all using ( auth.role() = 'authenticated' );


-- 13. 课程组队表 (Course Teaming)
create table public.course_teaming (
  id uuid default gen_random_uuid() primary key,
  course_id text references public.courses(id) on delete cascade,
  user_id uuid references public.users(id),
  user_name text,
  user_avatar text,
  user_major text,
  section text,
  self_intro text,
  target_teammate text,
  contacts jsonb,
  status text default 'open',
  likes int default 0,
  comment_count int default 0,
  created_at timestamptz default now()
);

alter table public.course_teaming enable row level security;
create policy "Teaming requests are viewable by everyone." on public.course_teaming for select using ( true );
create policy "Anyone can insert teaming requests." on public.course_teaming for insert with check ( true );

-- 14. 组队评论表 (Teaming Comments)
create table public.teaming_comments (
  id uuid default gen_random_uuid() primary key,
  teaming_id uuid references public.course_teaming(id) on delete cascade,
  author_id uuid references public.users(id),
  author_name text,
  author_avatar text,
  content text,
  created_at timestamptz default now()
);

alter table public.teaming_comments enable row level security;
create policy "Teaming comments are viewable by everyone." on public.teaming_comments for select using ( true );
create policy "Anyone can insert teaming comments." on public.teaming_comments for insert with check ( true );

-- 15. 组队评论数自增函数
create or replace function public.increment_teaming_comment_count(row_id uuid)
returns void as $$
begin
  update public.course_teaming
  set comment_count = comment_count + 1
  where id = row_id;
end;
$$ language plpgsql security definer;
