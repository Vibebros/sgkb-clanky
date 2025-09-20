from django.http import HttpResponse
import datetime

from django.views.generic import TemplateView

def current_datetime(request):
    now = datetime.datetime.now()
    html = '<html lang="en"><body>It is now %s.</body></html>' % now
    return HttpResponse(html)


class ChatBotView(TemplateView):
    template_name = "chat.html"


class DashboardView(TemplateView):
    template_name = "dashboard.html"


class PartnersView(TemplateView):
    template_name = "partners.html"