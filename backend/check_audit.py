import sqlite3
import pandas as pd

DATABASE_FILE = "audit.db"

def display_audit_log():
    """Connects to the database and prints all audit entries."""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        
        # Read all data directly into a pandas DataFrame (MODIFIED QUERY)
        df = pd.read_sql_query("SELECT * FROM loan_audits", conn)
        
        conn.close()

        if df.empty:
            print("The loan_audits table is currently empty.")
        else:
            print("--- All Audit Entries ---")
            # Displaying the DataFrame helps visualize the logged data
            print(df) 
            
    except sqlite3.Error as e:
        print(f"Error accessing database: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    display_audit_log()
