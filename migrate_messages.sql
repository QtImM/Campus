-- 1. 清空 messages 表
TRUNCATE TABLE messages;

-- 2. 删除旧的 room_id 列
ALTER TABLE messages DROP COLUMN IF EXISTS room_id;

-- 3. 添加新的 course_id 列（文本类型，与 courses.id 匹配）
ALTER TABLE messages ADD COLUMN course_id TEXT;

-- 4. 添加外键约束（引用 courses 表的 id）
ALTER TABLE messages
ADD CONSTRAINT fk_messages_course
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_course_id ON messages(course_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
