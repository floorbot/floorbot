CREATE TABLE dispute (
    epoch DECIMAL(64,0) NOT NULL,
    dispute_user_id VARCHAR(64) NOT NULL,
    message_user_id VARCHAR(64) NOT NULL,
    guild_id VARCHAR(64) NOT NULL,
    channel_id VARCHAR(64) NOT NULL,
    message_id VARCHAR(64) NOT NULL,
    content VARCHAR(4000) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
    vote_user_id VARCHAR(64) NOT NULL,
    vote_choice BOOLEAN NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, channel_id, message_id, vote_user_id)
);
