CREATE TABLE auth_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  expiry_date TIMESTAMP,
  revoked BOOLEAN NOT NULL DEFAULT false,
  user_id BIGINT,
  CONSTRAINT fk_auth_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_auth_refresh_tokens_token ON auth_refresh_tokens(token);
CREATE INDEX idx_auth_refresh_tokens_user_id ON auth_refresh_tokens(user_id);