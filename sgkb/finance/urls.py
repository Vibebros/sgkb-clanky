from django.urls import path
from .views import current_datetime, ChatBotView, DashboardView, PartnersView, ExportTransactionsCSV, ExportTransactionsExcel

urlpatterns = [
    path('', current_datetime),
    path("chat/", ChatBotView.as_view(), name="chatbot"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("partners/", PartnersView.as_view(), name="partners"),
    path("export/csv/", ExportTransactionsCSV.as_view(), name="export_csv"),
    path("export/excel/", ExportTransactionsExcel.as_view(), name="export_excel"),
]

