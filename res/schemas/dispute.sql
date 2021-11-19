CREATE TABLE dispute (
    epoch BIGINT NOT NULL,
    dispute_user_id BIGINT NOT NULL,
    message_user_id BIGINT NOT NULL,
    guild_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,
    content VARCHAR(4000) NOT NULL,
    vote_user_id BIGINT NOT NULL,
    vote_choice BOOLEAN NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, channel_id, message_id, vote_user_id)
);
