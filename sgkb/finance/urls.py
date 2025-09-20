from django.urls import path
from .views import current_datetime, ChatBotView, DashboardView, PartnersView

urlpatterns = [
    path('', current_datetime),
    path("chat/", ChatBotView.as_view(), name="chatbot"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("partners/", PartnersView.as_view(), name="partners"),
]
