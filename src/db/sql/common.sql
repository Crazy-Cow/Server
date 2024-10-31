-- DROP TABLE IF EXISTS posts;
-- DROP TABLE IF EXISTS users;

-- TRUNCATE TABLE posts;
DELETE FROM users; --  Cannot truncate a table referenced in a foreign key constraint
