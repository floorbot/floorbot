CREATE TABLE emoji (
    name VARCHAR(256) NOT NULL,
    emoji_name VARCHAR(256) NOT NULL,
    emoji_id VARCHAR(64) NOT NULL,
    animated BOOLEAN NOT NULL,
    CONSTRAINT id PRIMARY KEY (name)
);
