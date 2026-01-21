import requests
import json

# URL do seu endpoint
url = 'http://127.0.0.1:5000/api/send-custom-email'

# O dicionário com os dados do e‑mail
payload = {
    "api_key": "U31TAJJ0MzIomTFIUtbDIXjG4jT0lCaI",
    "recipients": ["gtasanandreasuf@gmail.com"],
    "subject": "Exemplo de Email com Anexo",
    "body": "Olá,\n\nEste é um exemplo de e-mail com anexo.\n\nAtenciosamente,\nEquipe",
    "html_content": "<h1>Exemplo de Email com Anexo</h1>\n<p>Olá,</p>\n<p>Este é um exemplo de e-mail com anexo.</p>\n<p>Atenciosamente,<br>Equipe</p>",
    "sender": "contato@pgeda.com.br"
}

# Serializa o payload pra string JSON
data = {
    'payload': json.dumps(payload)
}

# Abre o(s) arquivo(s) que você quer anexar
# Se quiser múltiplos anexos, repita na dict files:
files = {
    'attachments': open('teste_oportunidade_jovem1.pdf', 'rb')
    # 'attachments': open('outro.pdf','rb'),  # pra mais de 1 anexo
}

# Faz o POST
response = requests.post(url, data=data, files=files)

# Verifica o retorno
print(response.status_code)
print(response.json())
