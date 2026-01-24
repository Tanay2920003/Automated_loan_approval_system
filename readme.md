Simple setup is miniconda and env
# how to run 
pip install -r requirements.txt

uvicorn app:app --reload
http://127.0.0.1:8000/docs
link 


RUNNING ON 


Create a virtual environment (venv)
Windows (PowerShell / CMD)

Go to your project folder:

cd path\to\your\project


Create venv (named .venv):

python -m venv .venv

Activate the venv
✅ Windows PowerShell
.\.venv\Scripts\Activate.ps1


If PowerShell blocks it, run this once:

Set-ExecutionPolicy -Scope CurrentUser RemoteSigned


Then activate again:

.\.venv\Scripts\Activate.ps1

✅ Windows CMD
.\.venv\Scripts\activate.bat

macOS / Linux

Create:

python3 -m venv .venv


Activate:

source .venv/bin/activate



![alt text](images/image.png)
Data visuals 
![alt text](images/image-1.png)
UI
![alt text](images/image-2.png)
![alt text](images/image-3.png)
Result
![alt text](images/image-4.png)