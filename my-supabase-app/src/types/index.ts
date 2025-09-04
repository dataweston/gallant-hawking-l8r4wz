export interface User {
    id: string;
    email: string;
    created_at: string;
}

export interface DatabaseRecord {
    id: string;
    created_at: string;
    updated_at: string;
    [key: string]: any; // Allows for additional fields
}