venv:
	python3 -m venv .venv

install:
	pip install -r requirements.txt

server:
	cd sgkb && python manage.py runserver

migrations:
	cd sgkb && python manage.py makemigrations

migrate:
	cd sgkb && python manage.py migrate

user:
	cd sgkb && python manage.py createsuperuser