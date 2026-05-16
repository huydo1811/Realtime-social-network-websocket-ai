-- Chuẩn hóa cặp user_id1 < user_id2 (tránh trùng logic tìm kiếm / insert)
UPDATE friendships
SET user_id1 = LEAST(user_id1, user_id2),
    user_id2 = GREATEST(user_id1, user_id2)
WHERE user_id1 > user_id2;
