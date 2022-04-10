CREATE TABLE booru (
    user_id VARCHAR(64) NOT NULL,
    image_url VARCHAR(256) NOT NULL,
    post_url VARCHAR(256) NOT NULL,
    api_name VARCHAR(256) NOT NULL,
    api_icon_url VARCHAR(256) NOT NULL,
    epoch DECIMAL(64,0) NOT NULL,
    notes VARCHAR(1024) NOT NULL,
    CONSTRAINT id PRIMARY KEY (user_id, image_url)
);
