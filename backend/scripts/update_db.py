from sqlalchemy import create_engine, text
from backend.db.session import SQLALCHEMY_DATABASE_URL

def add_columns():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        # List of columns to add
        columns = [
            ("age", "INTEGER"),
            ("gender", "VARCHAR"),
            ("country", "VARCHAR"),
            ("group_size", "INTEGER"),
            ("visit_motive", "VARCHAR")
        ]
        
        for col_name, col_type in columns:
            try:
                sql = text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                conn.execute(sql)
                print(f"Added column {col_name}")
            except Exception as e:
                print(f"Column {col_name} might already exist or error: {e}")
                # In case of error (e.g. column exists), we continue
                pass
        
        conn.commit()
        print("Database update complete.")

if __name__ == "__main__":
    add_columns()
