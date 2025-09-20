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

redis:
	docker run -d --name redis -p 127.0.0.1:6379:6379 redis:7-alpine

worker:
	cd sgkb && celery -A sgkb worker -B -l info

shell:
	cd sgkb && python manage.py shell
