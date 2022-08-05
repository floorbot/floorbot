CREATE TABLE dispute_vote (
    message_id VARCHAR(64) NOT NULL,
    channel_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    epoch DECIMAL(64,0) NOT NULL,
    vote VARCHAR(256) NOT NULL,
    CONSTRAINT id PRIMARY KEY (message_id, channel_id, user_id),
    FOREIGN KEY (message_id, channel_id) REFERENCES dispute(message_id, channel_id)
);
