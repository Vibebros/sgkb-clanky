from django.db import models

class Logo(models.Model):
    name = models.CharField(max_length=255, unique=True)  # e.g. "COOP"
    domain = models.CharField(max_length=255, blank=True, null=True)  # e.g. "coop.ch"
    url = models.URLField(max_length=255, verbose_name='URL')
    last_checked_at = models.DateTimeField(auto_now=True)


class Catagory(models.Model):
    name = models.CharField(max_length=255, unique=True)
    def __str__(self):
        return f"{self.name}"


class BankTransaction(models.Model):
    account_name = models.CharField(max_length=255, verbose_name="Money Account Name")  # MONEY_ACCOUNT_NAME
    currency_type = models.CharField(max_length=10, verbose_name="Currency")  # MAC_CURRY_NAME
    macc_type = models.CharField(max_length=50, verbose_name="Account Type")  # MACC_TYPE
    produkt = models.CharField(max_length=100, verbose_name="Produkt")  # PRODUKT
    customer_name = models.CharField(max_length=255, verbose_name="Customer Name")  # KUNDEN_NAME

    trx_id = models.BigIntegerField(verbose_name="Transaction ID")  # TRX_ID
    trx_type_id = models.IntegerField(verbose_name="Transaction Type ID", blank=True, null=True)  # TRX_TYPE_ID
    trx_type_short = models.CharField(max_length=50, verbose_name="Transaction Type Short")  # TRX_TYPE_SHORT
    trx_type_name = models.CharField(max_length=100, verbose_name="Transaction Type Name")  # TRX_TYPE_NAME

    buchungs_art_short = models.CharField(max_length=50, verbose_name="Booking Type Short")  # BUCHUNGS_ART_SHORT
    buchungs_art_name = models.CharField(max_length=100, verbose_name="Booking Type Name")  # BUCHUNGS_ART_NAME

    val_date = models.DateField(verbose_name="Value Date")  # VAL_DATE
    trx_date = models.DateField(verbose_name="Transaction Date")  # TRX_DATE

    direction = models.SmallIntegerField(choices=[(1, "Inflow"), (2, "Outflow")], verbose_name="Direction")  # DIRECTION
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Amount", blank=True, null=True)  # AMOUNT

    trx_curry_id = models.IntegerField(verbose_name="Transaction Currency ID", blank=True, null=True)  # TRX_CURRY_ID
    trx_curry_name = models.CharField(max_length=10, verbose_name="Transaction Currency Name")  # TRX_CURRY_NAME

    text_short_creditor = models.CharField(max_length=255, blank=True, null=True, verbose_name="Text Short Creditor")  # TEXT_SHORT_CREDITOR
    text_creditor = models.TextField(blank=True, null=True, verbose_name="Text Creditor")  # TEXT_CREDITOR
    text_short_debitor = models.CharField(max_length=255, blank=True, null=True, verbose_name="Text Short Debitor")  # TEXT_SHORT_DEBITOR
    text_debitor = models.TextField(blank=True, null=True, verbose_name="Text Debitor")  # TEXT_DEBITOR

    point_of_sale_and_location = models.CharField(max_length=255, blank=True, null=True, verbose_name="POS & Location")  # POINT_OF_SALE_AND_LOCATION
    acquirer_country_id = models.IntegerField(blank=True, null=True, verbose_name="Acquirer Country ID")  # ACQUIRER_COUNTRY_ID
    acquirer_country_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Acquirer Country")  # ACQUIRER_COUNTRY_NAME

    card_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="Card ID")  # CARD_ID

    cred_acc_text = models.CharField(max_length=255, blank=True, null=True, verbose_name="Creditor Account Text")  # CRED_ACC_TEXT
    cred_iban = models.CharField(max_length=34, blank=True, null=True, verbose_name="Creditor IBAN")  # CRED_IBAN (IBAN max length = 34)
    cred_addr_text = models.TextField(blank=True, null=True, verbose_name="Creditor Address")  # CRED_ADDR_TEXT
    cred_ref_nr = models.CharField(max_length=100, blank=True, null=True, verbose_name="Creditor Reference Number")  # CRED_REF_NR
    cred_info = models.TextField(blank=True, null=True, verbose_name="Creditor Info")  # CRED_INFO

    logo = models.ForeignKey(Logo, verbose_name='URL', blank=True, null=True, on_delete=models.SET_NULL)
    catagory = models.ForeignKey(Catagory, verbose_name='category', blank=True, null=True, on_delete=models.SET_NULL)
    class Meta:
        verbose_name = "Bank Transaction"
        verbose_name_plural = "Bank Transactions"
        ordering = ['-val_date']

    def __str__(self):
        return f"{self.trx_id} - {self.customer_name} - {self.amount} {self.trx_curry_name}"


class Partners(models.Model):
    name = models.CharField(max_length=255, verbose_name="Partner Name")
    customer_benifits = models.TextField(max_length=255, verbose_name="Customer Benifits")

class Recommendation(models.Model):
    name = models.CharField(max_length=255, verbose_name="Partner Name")
    description = models.TextField(max_length=255, verbose_name="Description")