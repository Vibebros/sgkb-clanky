venv:
	python3 -m venv .venv

install:
	pip install -r requirements.txt

server:
	cd sgkb && python manage.py runserver