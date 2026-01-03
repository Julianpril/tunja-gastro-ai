from sqlalchemy import create_engine, text
from backend.db.session import SQLALCHEMY_DATABASE_URL

def update_db_schema():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as connection:
        # Add new columns if they don't exist
        # We use a try-catch block or check existence, but for simplicity in this env we'll just try to add them.
        # If they exist, it will fail, which is fine.
        
        columns = [
            ("age", "INTEGER"),
            ("gender", "VARCHAR"),
            ("country", "VARCHAR"),
            ("group_size", "INTEGER"),
            ("visit_motive", "VARCHAR")
        ]
        
        for col_name, col_type in columns:
            try:
                print(f"Adding column {col_name}...")
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                print(f"Column {col_name} added.")
            except Exception as e:
                print(f"Could not add column {col_name} (might already exist): {e}")
                
        connection.commit()

if __name__ == "__main__":
    update_db_schema()
