import re
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from flask import current_app
import base64

mail = Mail()
serializer = URLSafeTimedSerializer('chave_temporaria') 

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def get_smtp_config(sender_email):
    """Get SMTP configuration based on sender's email domain"""
    print(f"Sender email: {sender_email}")
    domain = sender_email.split('@')[-1]
    configs = current_app.config['SMTP_CONFIGS']
    
    # Use Gmail only for gmail.com emails
    if domain == 'gmail.com':
        print("Using Gmail SMTP")
        print(configs['gmail.com'])
        return configs['gmail.com']
    
    print("Using Zoho SMTP")
    print(configs['default'])
    return configs['default']

def send_verification_email(email, project_name, token, host_url, project=None):
    print(email)
    verification_url = host_url.rstrip('/') + f'/api/verify/{token}'
    
    sender = project.mail_username if project and project.mail_username else ''
    assert sender, 'Sender is required'
    
    # Get SMTP configuration based on sender's email domain
    smtp_config = get_smtp_config(sender)
    
    # Update Flask-Mail configuration
    current_app.config['MAIL_SERVER'] = smtp_config['server']
    current_app.config['MAIL_PORT'] = smtp_config['port']
    current_app.config['MAIL_USE_TLS'] = smtp_config['use_tls']
    
    msg = Message('Confirme seu Email',
                 sender=sender,
                 recipients=[email])
    msg.html = f'''
    <h1>Confirme seu Email</h1>
    <p>Para confirmar seu email para {project_name}, clique no link abaixo:</p>
    <p><a href="{verification_url}">Clique aqui para verificar seu email</a></p>
    <p>Se você não solicitou este email, ignore esta mensagem.</p>
    '''
    msg.body = f'''Para confirmar seu email para {project_name}, clique no link abaixo:
    {verification_url}

    Se você não solicitou este email, ignore esta mensagem.'''
    
    try:
        if project and project.mail_username and project.mail_password:
            # Configurar o Flask-Mail com as credenciais do projeto
            current_app.config['MAIL_USERNAME'] = project.mail_username
            current_app.config['MAIL_PASSWORD'] = project.mail_password
            
            
            # Criar uma nova instância do Mail com as configurações atualizadas
            project_mail = Mail(current_app)
            project_mail.send(msg)
        else:
            mail.send(msg)
            
    except Exception as e:
        print(f"Erro ao enviar email: {str(e)}")
        raise

def send_custom_email(recipients, subject, body,
                      html_content=None, sender=None,
                      attachments=None, cc=None, bcc=None, reply_to=None,
                      date=None, charset=None, extra_headers=None,
                      mail_options=None, rcpt_options=None, project=None):
    """Send a custom email with domain-specific SMTP configuration"""
    # Get SMTP configuration based on sender's email domain
    smtp_config = get_smtp_config(sender)
    
    # Update Flask-Mail configuration
    current_app.config['MAIL_SERVER'] = smtp_config['server']
    current_app.config['MAIL_PORT'] = smtp_config['port']
    current_app.config['MAIL_USE_TLS'] = smtp_config['use_tls']
    
    msg = Message(subject,
                 sender=sender,
                 recipients=recipients,
                 body=body,
                 html=html_content,
                 cc=cc,
                 bcc=bcc,
                 reply_to=reply_to,
                 date=date,
                 charset=charset,
                 extra_headers=extra_headers,
                 mail_options=mail_options,
                 rcpt_options=rcpt_options)

    if attachments:
        for attachment in attachments:
            if len(attachment) == 3:
                filename, content_type, data = attachment
                # Se os dados estiverem em base64, decodifica
                if isinstance(data, str):
                    try:
                        data = base64.b64decode(data)
                    except Exception:
                        pass  # Se não for base64, assume que já está nos bytes corretos
                # Anexa o arquivo
                msg.attach(filename=filename, 
                          content_type=content_type,
                          data=data)
    
    msg.reply_to = sender

    try:
        if project and project.mail_username and project.mail_password:
            # Configurar o Flask-Mail com as credenciais do projeto
            current_app.config['MAIL_USERNAME'] = project.mail_username
            current_app.config['MAIL_PASSWORD'] = project.mail_password
            
            # Criar uma nova instância do Mail com as configurações atualizadas
            project_mail = Mail(current_app)
            project_mail.send(msg)
        else:
            mail.send(msg)
            
        # Adiciona cabeçalho de cancelamento de inscrição
        unsub_domain = (sender or '').split('@')[-1]
        if unsub_domain:
            msg.extra_headers = {**(msg.extra_headers or {}), 
                              'List-Unsubscribe': f'<mailto:unsubscribe@{unsub_domain}>'}
            
        return True
        
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar email: {str(e)}")
        raise
