-- Create contacts table for email suggestions and autocomplete

CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    frequency INTEGER NOT NULL DEFAULT 1,
    last_contacted TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique combination of user_email and contact_email
    CONSTRAINT uk_user_contact_email UNIQUE (user_email, contact_email)
);

-- Create indexes for performance
CREATE INDEX idx_contacts_user_email ON contacts(user_email);
CREATE INDEX idx_contacts_frequency ON contacts(user_email, frequency DESC, last_contacted DESC);
CREATE INDEX idx_contacts_search ON contacts(user_email, contact_email);
CREATE INDEX idx_contacts_name_search ON contacts(user_email, contact_name);

-- Insert some sample contacts for testing
INSERT INTO contacts (user_email, contact_email, contact_name, frequency, last_contacted) VALUES
('test@localhost', 'john.doe@example.com', 'John Doe', 5, CURRENT_TIMESTAMP - INTERVAL '1 day'),
('test@localhost', 'jane.smith@company.com', 'Jane Smith', 3, CURRENT_TIMESTAMP - INTERVAL '2 days'),
('test@localhost', 'admin@system.com', 'System Admin', 2, CURRENT_TIMESTAMP - INTERVAL '1 week'),
('test@localhost', 'support@helpdesk.com', 'Support Team', 1, CURRENT_TIMESTAMP - INTERVAL '2 weeks'),
('admin@localhost', 'manager@company.com', 'Project Manager', 4, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('admin@localhost', 'hr@company.com', 'HR Department', 2, CURRENT_TIMESTAMP - INTERVAL '1 week');